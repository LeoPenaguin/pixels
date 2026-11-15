package main

import "testing"

func TestLocate(t *testing.T) {
	cases := []struct {
		x, y int
		key  string
		off  int64
	}{
		{0, 0, "chunk:0:0", 0},
		{255, 0, "chunk:0:0", 255},
		{256, 1, "chunk:1:0", 256},
		{-1, -1, "chunk:-1:-1", 255*256 + 255},
		{-256, -257, "chunk:-1:-2", 255 * 256},
	}
	for _, c := range cases {
		key, off := locate(c.x, c.y)
		if key != c.key || off != c.off {
			t.Errorf("locate(%d,%d) = %s,%d ; attendu %s,%d", c.x, c.y, key, off, c.key, c.off)
		}
	}
}

func TestValid(t *testing.T) {
	if !(pixel{-5, 7, 0}).valid() || (pixel{0, 0, len(palette)}).valid() ||
		(pixel{worldLimit, 0, 1}).valid() || (pixel{0, 0, -1}).valid() {
		t.Error("validation incorrecte")
	}
}

func TestParsePixel(t *testing.T) {
	for in, want := range map[string]bool{
		`{"x":-5,"y":7,"c":3}`:  true,
		`{}`:                    false,
		`{"x":1,"y":2}`:         false,
		`{"x":1.5,"y":2,"c":1}`: false,
		`{"x":1,"y":2,"c":99}`:  false,
		`nope`:                  false,
	} {
		if _, ok := parsePixel([]byte(in)); ok != want {
			t.Errorf("parsePixel(%s) = %v", in, ok)
		}
	}
}
