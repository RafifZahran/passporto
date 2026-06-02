package entity

import "errors"

// ErrSlotFull is returned when a slot's filled count would exceed its capacity.
// Using a sentinel error allows callers to check with errors.Is().
var ErrSlotFull = errors.New("slot is fully booked")
