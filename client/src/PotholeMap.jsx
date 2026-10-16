
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./PotholeMap.css";

// Fix default marker icons in Vite
const potholeIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

function getCoordinates(report) {
  let location = report.location;

  // Support older records where location is a JSON string
  if (typeof location === "string") {
    try {
      location = JSON.parse(location);
    } catch {
      return null;
    }
  }

  const latitude = Number(
    location?.latitude ?? location?.lat ?? report.latitude ?? report.lat
  );

  const longitude = Number(
    location?.longitude ?? location?.lng ?? report.longitude ?? report.lng
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  // Avoid treating missing coordinates as (0, 0)
  if (
    !(
      location?.latitude != null ||
      location?.lat != null ||
      report.latitude != null ||
      report.lat != null
    ) ||
    !(
      location?.longitude != null ||
      location?.lng != null ||
      report.longitude != null ||
      report.lng != null
    )
  ) {
    return null;
  }

  return [latitude, longitude];
}

function FitMapToMarkers({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, positions]);

  return null;
}

export default function PotholeMap({ reports = [] }) {
  const mappedReports = reports
    .map((report) => ({
      report,
      position: getCoordinates(report),
    }))
    .filter((item) => item.position !== null);

  const positions = mappedReports.map((item) => item.position);
  const defaultCenter = [17.385, 78.4867]; // Hyderabad fallback

  return (
    <section className="pothole-map-section">
      <div className="pothole-map-heading">
        <h2>Pothole Map</h2>
        <span>{mappedReports.length} location(s) mapped</span>
      </div>

      {mappedReports.length === 0 && (
        <p className="pothole-map-message">
          No reports with GPS coordinates are available yet.
        </p>
      )}

      <MapContainer
        center={positions[0] || defaultCenter}
        zoom={12}
        className="pothole-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {positions.length > 0 && (
          <FitMapToMarkers positions={positions} />
        )}

        {mappedReports.map(({ report, position }, index) => (
          <Marker
            key={report._id || report.id || index}
            position={position}
            icon={potholeIcon}
          >
            <Popup>
              <div className="pothole-popup">
                <strong>{report.title || "Pothole Report"}</strong>
                <p>
                  <b>Severity:</b> {report.severity || "Not specified"}
                </p>
                <p>
                  <b>Status:</b> {report.status || "Pending"}
                </p>
                <p>
                  <b>Location:</b>{" "}
                  {typeof report.location === "object"
                    ? report.location?.address || "GPS location recorded"
                    : report.location || "GPS location recorded"}
                </p>
                <p>
                  <b>Coordinates:</b> {position[0].toFixed(5)},{" "}
                  {position[1].toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
