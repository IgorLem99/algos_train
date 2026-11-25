//go:build linux

package main

import (
	"bufio"
	"context"
	"fmt"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

// Песочница для Linux (раннер в контейнере запущен от root с урезанными capabilities):
//   - компиляция идёт от отдельного пользователя-сборщика (RUNNER_BUILD_UID);
//   - каждое решение выполняется от своего uid на слот (RUNNER_EXEC_UID_BASE+слот),
//     поэтому решения не видят и не могут убить друг друга и сам раннер;
//   - лимиты через prlimit: процессорное время, адресное пространство, размер
//     файлов, число дескрипторов и потоков;
//   - после запуска все процессы этого uid убиваются, его файлы в /tmp удаляются.
// Сеть отключается на уровне контейнера (internal-сеть в docker-compose).

func sandboxAvailable() bool {
	if os.Getenv("RUNNER_SANDBOX") == "off" || os.Geteuid() != 0 {
		return false
	}
	_, err := exec.LookPath("prlimit")
	return err == nil
}

func envInt(k string, def int) int {
	if v, err := strconv.Atoi(os.Getenv(k)); err == nil {
		return v
	}
	return def
}

func buildUID() int        { return envInt("RUNNER_BUILD_UID", 1001) }
func execUID(slot int) int { return envInt("RUNNER_EXEC_UID_BASE", 20000) + slot }

func (e *LocalExecutor) prepareSandbox() error {
	if !e.sandbox {
		return nil
	}
	if err := os.Chown(e.workRoot, 0, 0); err != nil {
		return err
	}
	// 0711: заходить можно, перечислять содержимое — нет (имена папок заданий случайные)
	if err := os.Chmod(e.workRoot, 0o711); err != nil {
		return err
	}
	if e.gocache == "" {
		e.gocache = "/cache/go-build"
	}
	if err := os.MkdirAll(e.gocache, 0o700); err != nil {
		return err
	}
	b := buildUID()
	return filepath.WalkDir(e.gocache, func(p string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		return os.Lchown(p, b, b)
	})
}

func (e *LocalExecutor) chownJob(dir string) error {
	if !e.sandbox {
		return nil
	}
	b := buildUID()
	ents, err := os.ReadDir(dir)
	if err != nil {
		return err
	}
	for _, en := range ents {
		if err := os.Chown(filepath.Join(dir, en.Name()), b, b); err != nil {
			return err
		}
	}
	if err := os.Chown(dir, b, b); err != nil {
		return err
	}
	return os.Chmod(dir, 0o700)
}

func killGroup(cmd *exec.Cmd) func() error {
	return func() error {
		if cmd.Process == nil {
			return nil
		}
		return syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
	}
}

func (e *LocalExecutor) buildCred(cmd *exec.Cmd) {
	if !e.sandbox {
		return
	}
	b := uint32(buildUID())
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: b, Gid: b, NoSetGroups: true},
		Setpgid:    true,
	}
	cmd.Cancel = killGroup(cmd)
	cmd.WaitDelay = 2 * time.Second
}

func (e *LocalExecutor) prepareExec(dir, bin, outFile string, slot int) error {
	if !e.sandbox {
		return nil
	}
	// исходники больше не нужны процессу решения
	for _, f := range []string{"solution.go", "judge_tests.go", "judge_main.go", "go.mod"} {
		_ = os.Chmod(filepath.Join(dir, f), 0o600)
	}
	if err := os.Chmod(dir, 0o711); err != nil {
		return err
	}
	if err := os.Chmod(bin, 0o755); err != nil {
		return err
	}
	u := execUID(slot)
	if err := os.Chown(outFile, u, u); err != nil {
		return err
	}
	return os.Chmod(outFile, 0o600)
}

func (e *LocalExecutor) execCommand(ctx context.Context, bin string, slot int, timeout time.Duration) *exec.Cmd {
	if !e.sandbox {
		cmd := exec.CommandContext(ctx, bin)
		cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
		cmd.Cancel = killGroup(cmd)
		cmd.WaitDelay = 2 * time.Second
		return cmd
	}
	cpu := int(timeout.Seconds()) + 1
	cmd := exec.CommandContext(ctx, "prlimit",
		"--cpu="+strconv.Itoa(cpu),
		"--as="+strconv.Itoa(envInt("RUNNER_MEM_MB", 1536)<<20),
		"--fsize="+strconv.Itoa(16<<20),
		"--nofile=64",
		"--nproc=256",
		"--core=0",
		"--", bin)
	u := uint32(execUID(slot))
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Credential: &syscall.Credential{Uid: u, Gid: u, NoSetGroups: true},
		Setpgid:    true,
	}
	cmd.Cancel = killGroup(cmd)
	cmd.WaitDelay = 2 * time.Second
	return cmd
}

// cleanupSlot убивает все процессы uid слота (даже сбежавшие из группы)
// и удаляет его файлы во временных папках.
func (e *LocalExecutor) cleanupSlot(slot int) {
	if !e.sandbox {
		return
	}
	u := execUID(slot)
	for round := 0; round < 3; round++ {
		pids := procsOfUID(u)
		if len(pids) == 0 {
			break
		}
		for _, pid := range pids {
			_ = syscall.Kill(pid, syscall.SIGKILL)
		}
		time.Sleep(20 * time.Millisecond)
	}
	for _, d := range []string{"/tmp", "/dev/shm", "/var/tmp"} {
		ents, err := os.ReadDir(d)
		if err != nil {
			continue
		}
		for _, en := range ents {
			p := filepath.Join(d, en.Name())
			var st syscall.Stat_t
			if syscall.Lstat(p, &st) == nil && int(st.Uid) == u {
				_ = os.RemoveAll(p)
			}
		}
	}
}

func procsOfUID(uid int) []int {
	ents, err := os.ReadDir("/proc")
	if err != nil {
		return nil
	}
	want := strconv.Itoa(uid)
	var out []int
	for _, en := range ents {
		pid, err := strconv.Atoi(en.Name())
		if err != nil {
			continue
		}
		f, err := os.Open(fmt.Sprintf("/proc/%d/status", pid))
		if err != nil {
			continue
		}
		sc := bufio.NewScanner(f)
		for sc.Scan() {
			if l := sc.Text(); strings.HasPrefix(l, "Uid:") {
				if f := strings.Fields(l); len(f) > 1 && f[1] == want {
					out = append(out, pid)
				}
				break
			}
		}
		f.Close()
	}
	return out
}
