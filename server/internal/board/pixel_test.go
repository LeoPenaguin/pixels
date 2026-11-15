package board

import "testing"

func TestLocate(t *testing.T) {
	cases := []struct {
		x, y int
		id   string
		off  int64
	}{
		{0, 0, "0:0", 0},
		{255, 0, "0:0", 255},
		{256, 1, "1:0", 256},
		{-1, -1, "-1:-1", 255*256 + 255},
		{-256, -257, "-1:-2", 255 * 256},
	}
	for _, c := range cases {
		id, off := Locate(c.x, c.y)
		if id != c.id || off != c.off {
			t.Errorf("Locate(%d, %d) = %s, %d ; attendu %s, %d", c.x, c.y, id, off, c.id, c.off)
		}
	}
}

func TestValid(t *testing.T) {
	valid := []Pixel{{-5, 7, 0}, {WorldLimit - 1, -WorldLimit + 1, len(Palette) - 1}}
	invalid := []Pixel{{0, 0, len(Palette)}, {0, 0, -1}, {WorldLimit, 0, 1}, {0, -WorldLimit, 1}}
	for _, p := range valid {
		if !p.Valid() {
			t.Errorf("%v should be valid", p)
		}
	}
	for _, p := range invalid {
		if p.Valid() {
			t.Errorf("%v should be invalid", p)
		}
	}
}

func TestChunkInWorld(t *testing.T) {
	lim := WorldLimit >> ChunkShift
	if !ChunkInWorld(-lim, lim-1) || ChunkInWorld(lim, 0) || ChunkInWorld(0, -lim-1) {
		t.Error("wrong chunk bounds")
	}
}

func TestParsePixel(t *testing.T) {
	for in, want := range map[string]bool{
		`{"x":-5,"y":7,"c":3}`:  true,
		`{}`:                    false,
		`{"x":1,"y":2}`:         false,
		`{"x":1,"c":2}`:         false,
		`{"y":1,"c":2}`:         false,
		`{"x":1.5,"y":2,"c":1}`: false,
		`{"x":1,"y":2,"c":99}`:  false,
		`nope`:                  false,
	} {
		if _, ok := ParsePixel([]byte(in)); ok != want {
			t.Errorf("ParsePixel(%s) = %v ; attendu %v", in, ok, want)
		}
	}
	if p, _ := ParsePixel([]byte(`{"x":-5,"y":7,"c":3}`)); p != (Pixel{-5, 7, 3}) {
		t.Errorf("ParsePixel decoded %v", p)
	}
}

func TestPalette(t *testing.T) {
	if Palette[0] != "#FFFFFF" {
		t.Error("index 0 must stay white (never-painted pixel)")
	}
	if len(Palette) > 256 {
		t.Error("a pixel is stored in one byte: 256 colours at most")
	}
}
