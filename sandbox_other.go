//go:build !linux

package main

import (
	"context"
	"os/exec"
	"time"
)

// На Windows/macOS песочницы нет: решения выполняются от текущего пользователя.
// Это годится только для локальной разработки — в продакшене раннер работает
// в Linux-контейнере (см. Dockerfile.runner).

func sandboxAvailable() bool                                     { return false }
func (e *LocalExecutor) prepareSandbox() error                   { return nil }
func (e *LocalExecutor) chownJob(string) error                   { return nil }
func (e *LocalExecutor) buildCred(*exec.Cmd)                     {}
func (e *LocalExecutor) prepareExec(_, _, _ string, _ int) error { return nil }
func (e *LocalExecutor) cleanupSlot(int)                         {}

func (e *LocalExecutor) execCommand(ctx context.Context, bin string, _ int, _ time.Duration) *exec.Cmd {
	cmd := exec.CommandContext(ctx, bin)
	cmd.WaitDelay = 2 * time.Second
	return cmd
}
