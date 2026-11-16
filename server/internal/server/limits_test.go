package server

import (
	"testing"
	"time"

	"golang.org/x/time/rate"
)

func TestQuotas(t *testing.T) {
	q := newQuotas(3, rate.Every(time.Hour))
	for i := range 3 {
		if !q.get("a").Allow() {
			t.Fatalf("pixel %d refused with a quota of 3", i+1)
		}
	}
	if q.get("a").Allow() {
		t.Error("4th pixel accepted")
	}
	if !q.get("b").Allow() {
		t.Error("the quota must be per IP")
	}

	q = newQuotas(1, rate.Inf)
	for range 100 {
		if !q.get("a").Allow() {
			t.Fatal("an infinite refill must be unlimited")
		}
	}
}

func TestForgetIdle(t *testing.T) {
	q := newQuotas(2, rate.Every(time.Hour))
	q.get("plein-deconnecte")
	q.get("plein-connecte")
	q.get("entame").Allow()
	q.forgetIdle(func(ip string) bool { return ip == "plein-connecte" })
	if _, ok := q.m["plein-deconnecte"]; ok {
		t.Error("a full bucket of a disconnected IP must be forgotten")
	}
	if _, ok := q.m["plein-connecte"]; !ok {
		t.Error("a connected IP keeps its bucket")
	}
	if _, ok := q.m["entame"]; !ok {
		t.Error("a partly used bucket is kept, otherwise disconnecting would refill it")
	}
}

func TestConnLimit(t *testing.T) {
	c := newConnLimit(2)
	if c.connected("a") {
		t.Error("nobody is connected at first")
	}
	first, second, third := c.acquire("a"), c.acquire("a"), c.acquire("a")
	if !first || !second || third {
		t.Error("at most 2 connections per IP")
	}
	if !c.acquire("b") {
		t.Error("the limit must be per IP")
	}
	c.release("a")
	if !c.connected("a") {
		t.Error("one connection left: still connected")
	}
	c.release("a")
	if c.connected("a") || len(c.n) != 1 {
		t.Error("no connection left: the IP must be forgotten")
	}
}
