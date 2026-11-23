---
id: stack
title: Стек
short: LIFO — последним пришёл, первым ушёл; вложенность, отмена действий, обход в глубину
group: Линейные структуры
icon: ≡
order: 7
viz: stack-parens
---
## Суть за 30 секунд

Стек — коллекция с доступом только к верхнему элементу: `push` кладёт наверх, `pop` снимает сверху, обе операции O(1). Порядок LIFO (last in, first out) — как стопка тарелок.

Стек нужен везде, где есть **вложенность** и надо вернуться к «последнему незакрытому»: скобки, вызовы функций, теги HTML, отмена действий, обход в глубину. Если в задаче «самое свежее незавершённое дело определяет, что делать дальше» — это стек.

## История

- **1946** — Алан Тьюринг в отчёте о проекте компьютера ACE описал механизм возврата из подпрограмм с операциями, которые он назвал BURY и UNBURY, — по сути стек адресов возврата.
- **1955–1957** — Клаус Замельсон и Фридрих Л. Бауэр (Мюнхен) сформулировали «принцип погреба» (Kellerprinzip) для трансляции арифметических выражений и в 1957 году подали на него патент. Позже Бауэр получил за это IEEE Computer Pioneer Award.
- **1957** — Чарльз Хэмблин предложил использовать обратную польскую запись вместе со стеком для вычисления выражений.
- **1961** — Эдсгер Дейкстра описал алгоритм «сортировочной станции» (shunting-yard) — перевод инфиксной записи в постфиксную с помощью стека операторов. В том же году была анонсирована Burroughs B5000 — одна из первых коммерческих машин со стековой архитектурой.

## Как работает

Интерфейс минимален: `Push(x)`, `Pop()`, `Peek()` (посмотреть вершину), `Len()`. В Go стек — это просто срез: вершина — последний элемент, `push` — `append`, `pop` — уменьшение длины.

Классический пример — проверка скобок:

1. Идём по строке слева направо.
2. Открывающую скобку кладём в стек — она «ждёт» своей пары.
3. Закрывающая должна совпасть с вершиной стека: совпала — `pop`, нет (или стек пуст) — строка некорректна.
4. В конце стек должен быть пуст — иначе остались незакрытые скобки.

Почему стек, а не счётчик: счётчик скажет, что `([)]` сбалансирована, а стек увидит, что `]` пытается закрыть `(`. Стек хранит не только *сколько* открыто, но и *в каком порядке*.

<div data-viz="stack-parens"></div>

<svg viewBox="0 0 640 220" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto">
<defs><marker id="st-ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0L10,5L0,10z" fill="var(--muted)"/></marker></defs>
<path d="M60,50 L60,200 L180,200 L180,50" fill="none" stroke="var(--muted)" stroke-width="2"/>
<rect x="66" y="160" width="108" height="34" rx="4" fill="var(--panel2)" stroke="var(--line)"/><text x="120" y="182" text-anchor="middle" font-size="14" fill="var(--text)">{</text>
<rect x="66" y="122" width="108" height="34" rx="4" fill="var(--panel2)" stroke="var(--line)"/><text x="120" y="144" text-anchor="middle" font-size="14" fill="var(--text)">[</text>
<rect x="66" y="84" width="108" height="34" rx="4" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="120" y="106" text-anchor="middle" font-size="14" fill="var(--text)">(</text>
<text x="190" y="106" font-size="12" fill="var(--accent)">← top</text>
<line x1="90" y1="20" x2="90" y2="76" stroke="var(--blue)" stroke-width="2" marker-end="url(#st-ar)"/>
<text x="84" y="16" text-anchor="end" font-size="12" fill="var(--blue)">push</text>
<line x1="150" y1="76" x2="150" y2="20" stroke="var(--hard)" stroke-width="2" marker-end="url(#st-ar)"/>
<text x="156" y="16" font-size="12" fill="var(--hard)">pop</text>
<text x="120" y="216" text-anchor="middle" font-size="12" fill="var(--muted)">LIFO</text>
<text x="290" y="34" font-size="13" fill="var(--muted)">в Go стек — это срез:</text>
<rect x="290" y="46" width="60" height="30" fill="var(--panel2)" stroke="var(--violet)"/><text x="320" y="66" text-anchor="middle" font-size="12" fill="var(--text)">ptr</text>
<rect x="350" y="46" width="70" height="30" fill="var(--panel2)" stroke="var(--violet)"/><text x="385" y="66" text-anchor="middle" font-size="12" fill="var(--text)">len = 3</text>
<rect x="420" y="46" width="70" height="30" fill="var(--panel2)" stroke="var(--violet)"/><text x="455" y="66" text-anchor="middle" font-size="12" fill="var(--text)">cap = 6</text>
<line x1="320" y1="76" x2="320" y2="104" stroke="var(--muted)" marker-end="url(#st-ar)"/>
<rect x="290" y="106" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="315" y="127" text-anchor="middle" font-size="13" fill="var(--text)">{</text>
<rect x="340" y="106" width="50" height="32" fill="var(--panel2)" stroke="var(--line)"/><text x="365" y="127" text-anchor="middle" font-size="13" fill="var(--text)">[</text>
<rect x="390" y="106" width="50" height="32" fill="var(--panel2)" stroke="var(--accent)" stroke-width="2"/><text x="415" y="127" text-anchor="middle" font-size="13" fill="var(--text)">(</text>
<rect x="440" y="106" width="50" height="32" fill="none" stroke="var(--line)" stroke-dasharray="3 3"/>
<rect x="490" y="106" width="50" height="32" fill="none" stroke="var(--line)" stroke-dasharray="3 3"/>
<rect x="540" y="106" width="50" height="32" fill="none" stroke="var(--line)" stroke-dasharray="3 3"/>
<text x="415" y="156" text-anchor="middle" font-size="12" fill="var(--accent)">s[len(s)-1] — вершина</text>
<text x="290" y="184" font-size="12" fill="var(--text)">push: s = append(s, x) — O(1) амортизированно</text>
<text x="290" y="204" font-size="12" fill="var(--text)">pop:  x, s = s[len(s)-1], s[:len(s)-1] — O(1)</text>
</svg>

## Шаблон на Go

```go
// isValid — проверка скобок на срезе-стеке.
func isValid(s string) bool {
	pair := map[rune]rune{')': '(', ']': '[', '}': '{'}
	st := make([]rune, 0, len(s))
	for _, c := range s {
		if open, ok := pair[c]; ok {
			if len(st) == 0 || st[len(st)-1] != open {
				return false
			}
			st = st[:len(st)-1]
		} else {
			st = append(st, c)
		}
	}
	return len(st) == 0
}

// evalRPN — вычисление обратной польской записи: ["2","1","+","3","*"] → 9.
func evalRPN(tokens []string) int {
	st := make([]int, 0, len(tokens))
	for _, t := range tokens {
		switch t {
		case "+", "-", "*", "/":
			a, b := st[len(st)-2], st[len(st)-1]
			st = st[:len(st)-2]
			var r int
			switch t {
			case "+":
				r = a + b
			case "-":
				r = a - b
			case "*":
				r = a * b
			default:
				r = a / b
			}
			st = append(st, r)
		default:
			n, _ := strconv.Atoi(t)
			st = append(st, n)
		}
	}
	return st[0]
}
```

Обобщённый стек, если нужен тип с методами:

```go
type Stack[T any] struct{ items []T }

func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }

func (s *Stack[T]) Pop() (T, bool) {
	var zero T
	if len(s.items) == 0 {
		return zero, false
	}
	v := s.items[len(s.items)-1]
	s.items[len(s.items)-1] = zero // не держим ссылку — пусть GC заберёт
	s.items = s.items[:len(s.items)-1]
	return v, true
}

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

func (s *Stack[T]) Len() int { return len(s.items) }
```

**Стек в рантайме Go.** Каждая горутина стартует со стеком около 2 КБ (с Go 1.4). Когда кадров не хватает, рантайм выделяет стек вдвое больше и *копирует* туда текущий, исправляя указатели (contiguous stacks, Go 1.3–1.4; раньше были сегментированные стеки, страдавшие от «hot split»). Поэтому миллион горутин — нормально. Предел — 1 ГБ на 64-битных системах: бесконечная рекурсия заканчивается `fatal error: stack overflow`. Escape analysis компилятора решает, может ли переменная жить в кадре стека или должна «убежать» в кучу (`go build -gcflags=-m` покажет решения). Для очень глубоких обходов (DFS по графу на 10⁶ вершин) явный стек на срезе надёжнее рекурсии.

## Сложность

| операция | время | память |
| --- | --- | --- |
| push (append) | O(1) амортизированно | O(1) |
| pop, peek, len | O(1) | O(1) |
| проверка скобок, вычисление ОПЗ | O(n) | O(n) |
| поиск произвольного элемента | O(n) | O(1) |

## Когда применять

- **Вложенные структуры**: скобки, теги, вложенные списки, `decode string` вроде `3[a2[c]]`.
- **«Последнее незакрытое»**: упростить путь `/a/./b/../c`, удалить соседние дубликаты, «астероиды».
- **Выражения**: калькулятор, ОПЗ, сортировочная станция (два стека — операнды и операторы).
- **Итеративный DFS** вместо рекурсии: обход дерева/графа, flood fill.
- **Отмена/повтор** — два стека (undo и redo).
- **Min Stack** — параллельный стек минимумов (O(1) на getMin).
- «Следующий больший/меньший элемент» — уже монотонный стек (отдельная статья).

## Где применяется в реальном мире

### Бигтех
- **Call stack**: каждый вызов функции кладёт кадр с локальными переменными и адресом возврата; в Go у каждой горутины свой растущий стек.
- **Стековые виртуальные машины**: байткод JVM, CPython и WebAssembly работает со стеком операндов — инструкция сложения снимает два значения и кладёт сумму.
- **Браузеры**: HTML-парсер по спецификации WHATWG поддерживает «stack of open elements»; кнопки «назад/вперёд» концептуально — два стека истории.
- **Редакторы и IDE**: undo/redo реализуют стеками команд или изменений — стандартная практика.

### Финтех
- **Движки правил и калькуляторы формул** (тарифы, скоринг, комиссии): выражение из конфигурации переводится сортировочной станцией в ОПЗ и вычисляется на стеке.
- **LIFO-учёт лотов**: при продаже списываются последние купленные лоты. LIFO разрешён в US GAAP, но запрещён в IFRS.
- **Вложенные транзакции**: SAVEPOINT в PostgreSQL образуют стек — `ROLLBACK TO SAVEPOINT` откатывает до нужной точки, снимая все более поздние.

### Геймдев
- **Стек состояний игры** (pushdown automaton): пауза, меню, инвентарь кладутся поверх геймплея и снимаются при выходе — паттерн описан в «Game Programming Patterns» Роберта Нистрома (глава State).
- **Undo в редакторах уровней и пазлах** в духе Sokoban: паттерн Command + стек выполненных команд.
- **Итеративный flood fill**: заливка областей, поиск связных регионов на тайловой карте — явный стек вместо рекурсии, чтобы не упереться в лимит стека.
- **Lua C API**: значения между C/C++-движком и Lua-скриптами передаются через виртуальный стек (`lua_push*`, `lua_pop`).

## Типичные ошибки

- **Pop из пустого стека**: `st[len(st)-1]` при `len == 0` — паника index out of range. Проверяйте длину до обращения (особенно на «лишней» закрывающей скобке).
- **Забыть проверить стек в конце**: `"(("` — ни одной ошибки по ходу, но стек не пуст.
- **Порядок операндов** при pop: в `a − b` и `a / b` первым снимается `b`.
- **Утечка памяти** в стеке указателей: `s = s[:len(s)-1]` оставляет ссылку в базовом массиве — обнуляйте элемент перед укорачиванием.
- **Глубокая рекурсия** там, где глубина достигает 10⁶, — используйте явный стек.
- **Сохранение среза-стека «на память»** (`snapshot := st`) — при следующем `append` оба среза могут писать в один массив; копируйте через `slices.Clone`.
