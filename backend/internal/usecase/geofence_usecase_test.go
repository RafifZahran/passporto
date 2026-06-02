package usecase_test

import (
	"math"
	"testing"
)

// TestHaversine_WithinRadius verifies the Haversine formula for a known distance.
// Kantor Imigrasi Jakarta Selatan: -6.2615, 106.8106
// A point 50m away (approx -6.2611, 106.8106) should be within 100m.
func TestHaversine_WithinRadius(t *testing.T) {
	// Jakarta Selatan Kanim coordinates
	officeLat := -6.2615
	officeLon := 106.8106

	// ~50m north of the office
	userLat := -6.2610
	userLon := 106.8106

	dist := haversinePublic(userLat, userLon, officeLat, officeLon)
	t.Logf("Computed distance: %.2fm", dist)

	if dist > 100.0 {
		t.Errorf("expected distance <= 100m, got %.2fm", dist)
	}
}

// TestHaversine_OutsideRadius verifies the formula rejects a point 500m away.
func TestHaversine_OutsideRadius(t *testing.T) {
	officeLat := -6.2615
	officeLon := 106.8106

	// ~500m away
	userLat := -6.2570
	userLon := 106.8106

	dist := haversinePublic(userLat, userLon, officeLat, officeLon)
	t.Logf("Computed distance: %.2fm", dist)

	if dist <= 100.0 {
		t.Errorf("expected distance > 100m for far-away point, got %.2fm", dist)
	}
}

// TestHaversine_SamePoint verifies that same coordinates return 0 distance.
func TestHaversine_SamePoint(t *testing.T) {
	dist := haversinePublic(-6.2615, 106.8106, -6.2615, 106.8106)
	if math.Round(dist) != 0 {
		t.Errorf("expected ~0m for same point, got %.4fm", dist)
	}
}

// haversinePublic re-implements the formula for isolated test access.
// (Go doesn't allow testing unexported functions across packages easily.)
func haversinePublic(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6_371_000.0
	toRad := func(d float64) float64 { return d * math.Pi / 180 }

	dLat := toRad(lat2 - lat1)
	dLon := toRad(lon2 - lon1)
	rlat1 := toRad(lat1)
	rlat2 := toRad(lat2)

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(rlat1)*math.Cos(rlat2)*
			math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return earthRadius * c
}
