
import { Fragment, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./App.css";
import Auth from "./Auth";

const AUTH_STORAGE_KEY = "roadcare_auth";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function App() {
  const [authData, setAuthData] = useState(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      return savedAuth ? JSON.parse(savedAuth) : null;
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("Dashboard");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [selectedReportId, setSelectedReportId] = useState(null);
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");

  // Citizen report form
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("Medium");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Officer repair form
  const [repairingReportId, setRepairingReportId] = useState(null);
  const [repairDescription, setRepairDescription] = useState("");
  const [repairedImageFile, setRepairedImageFile] = useState(null);
  const [repairedImagePreview, setRepairedImagePreview] = useState("");
  const [repairSubmitting, setRepairSubmitting] = useState(false);

  const isOfficer = authData?.user?.role === "officer";
  const isCitizen = authData?.user?.role === "citizen";

  useEffect(() => {
    if (!imageFile) {
      setImagePreview("");
      return undefined;
    }

    const url = URL.createObjectURL(imageFile);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  useEffect(() => {
    if (!repairedImageFile) {
      setRepairedImagePreview("");
      return undefined;
    }

    const url = URL.createObjectURL(repairedImageFile);
    setRepairedImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [repairedImageFile]);

  function handleLogin(data) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
    setAuthData(data);
    setActivePage("Dashboard");
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setTitle("");
    setAddress("");
    setCoordinates(null);
    setLocationLoading(false);
    setDescription("");
    setSeverity("Medium");
    setImageFile(null);
  }

  function resetRepairForm() {
    setRepairDescription("");
    setRepairedImageFile(null);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuthData(null);
    setActivePage("Dashboard");
    setReports([]);
    setAnalytics(null);
    setSelectedReportId(null);
    setRepairingReportId(null);
    setStatusFilter("All");
    setSeverityFilter("All");
    setSearch("");
    setError("");
    setSuccess("");
    setAnalyticsError("");
    resetForm();
    resetRepairForm();
  }

  async function fetchReports() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/api/reports`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load reports.");
      }

      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check that your server is running on port 5000."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    setAnalyticsError("");

    try {
      const response = await fetch(`${API_URL}/api/analytics`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to load analytics.");
      }

      setAnalytics(data);
    } catch (err) {
      setAnalyticsError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the analytics API. Check that your backend is running on port 5000."
          : err.message
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }

  useEffect(() => {
    if (authData) {
      fetchReports();
    }
  }, [authData]);

  useEffect(() => {
    if (authData && activePage === "Analytics") {
      fetchAnalytics();
    }
  }, [authData, activePage]);

  // Dashboard cards open Reports with the selected filter.
  function handleDashboardCardClick(filter) {
    setStatusFilter(filter);
    setSeverityFilter("All");
    setSearch("");
    setSelectedReportId(null);
    setActivePage("Reports");
    setError("");
    setSuccess("");
  }

  // Keyboard accessibility for dashboard cards.
  function handleCardKeyDown(event, filter) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleDashboardCardClick(filter);
    }
  }

  function handleGetCurrentLocation() {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError("Your browser does not support location detection.");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        setCoordinates({ latitude, longitude });
        setAddress(`${latitude}, ${longitude}`);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );

          if (response.ok) {
            const data = await response.json();

            if (data.display_name) {
              setAddress(data.display_name);
            }
          }
        } catch {
          // Keep the coordinates if address lookup fails.
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        setLocationLoading(false);

        const messages = {
          1: "Location permission was denied. Allow location access in your browser settings.",
          2: "Your current location could not be detected. Please try again.",
          3: "Location detection timed out. Please try again.",
        };

        setError(
          messages[err.code] ||
            "Unable to detect your current location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;

    setError("");
    setSuccess("");

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageFile(null);
      event.target.value = "";
      setError("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageFile(null);
      event.target.value = "";
      setError("Image size must be 5 MB or less.");
      return;
    }

    setImageFile(file);
  }

  function handleRepairedImageChange(event) {
    const file = event.target.files?.[0] || null;

    setError("");
    setSuccess("");

    if (!file) {
      setRepairedImageFile(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setRepairedImageFile(null);
      event.target.value = "";
      setError(
        "Please select a repaired-road image in JPG, PNG or WEBP format."
      );
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setRepairedImageFile(null);
      event.target.value = "";
      setError("The repaired-road image must be 5 MB or less.");
      return;
    }

    setRepairedImageFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isCitizen) {
      setError("Only citizens can submit new pothole reports.");
      return;
    }

    if (!authData?.token) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    if (!title.trim() || !address.trim() || !description.trim()) {
      setError("Please fill in the title, location and description.");
      return;
    }

    if (imageFile && !ALLOWED_IMAGE_TYPES.includes(imageFile.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (imageFile && imageFile.size > MAX_IMAGE_SIZE) {
      setError("Image size must be 5 MB or less.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", description.trim());

      const locationData = {
        address: address.trim(),
        ...(coordinates && {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }),
      };

      formData.append("location", JSON.stringify(locationData));
      formData.append("severity", severity);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`${API_URL}/api/reports`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit report.");
      }

      setSuccess("Pothole report submitted successfully!");

      resetForm();
      await fetchReports();

      setActivePage("Reports");
      setStatusFilter("All");
      setSeverityFilter("All");
      setSearch("");
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Check your server and try again."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRepairSubmit(event, reportId) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isOfficer) {
      setError("Only officers can update repair details.");
      return;
    }

    if (!authData?.token) {
      setError("Your login session is missing. Please log in again.");
      return;
    }

    if (!repairDescription.trim()) {
      setError("Please enter the repair notes.");
      return;
    }

    if (!repairedImageFile) {
      setError("Please choose a photo of the repaired road.");
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(repairedImageFile.type)) {
      setError("Please select a JPG, PNG or WEBP image.");
      return;
    }

    if (repairedImageFile.size > MAX_IMAGE_SIZE) {
      setError("The repaired-road image must be 5 MB or less.");
      return;
    }

    setRepairSubmitting(true);

    try {
      const formData = new FormData();

      formData.append(
        "repairDescription",
        repairDescription.trim()
      );
      formData.append("repairedImage", repairedImageFile);

      const response = await fetch(
        `${API_URL}/api/reports/${reportId}/repair`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${authData.token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update repair details."
        );
      }

      setSuccess("Pothole marked as repaired successfully!");
      setRepairingReportId(null);
      setSelectedReportId(reportId);
      resetRepairForm();

      await fetchReports();
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to the backend. Please try again."
          : err.message
      );
    } finally {
      setRepairSubmitting(false);
    }
  }

  // Normalize status and severity before comparing them.
  function getNormalizedStatus(report) {
    return (report.status || "Pending").trim().toLowerCase();
  }

  function getNormalizedSeverity(report) {
    return (report.severity || "Medium").trim().toLowerCase();
  }

  function isRepaired(report) {
    return ["repaired", "resolved"].includes(
      getNormalizedStatus(report)
    );
  }

  const pendingCount = reports.filter(
    (report) => getNormalizedStatus(report) === "pending"
  ).length;

  const resolvedCount = reports.filter(isRepaired).length;

  const highPriorityCount = reports.filter((report) =>
    ["high", "critical"].includes(getNormalizedSeverity(report))
  ).length;

  // Search, severity filter and dashboard filters work together.
  const filteredReports = reports.filter((report) => {
    const locationText =
      typeof report.location === "string"
        ? report.location
        : report.location?.address || "";

    const searchableText = [
      report.title,
      report.description,
      locationText,
      report.severity,
      report.status,
      report.repairDescription,
      report.createdByEmail,
      report.repairedBy,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesSeverity =
      severityFilter === "All" ||
      getNormalizedSeverity(report) === severityFilter.toLowerCase();

    let matchesDashboardFilter = true;

    if (statusFilter === "Pending") {
      matchesDashboardFilter =
        getNormalizedStatus(report) === "pending";
    } else if (statusFilter === "Repaired") {
      matchesDashboardFilter = isRepaired(report);
    } else if (statusFilter === "High Priority") {
      matchesDashboardFilter = ["high", "critical"].includes(
        getNormalizedSeverity(report)
      );
    }

    return (
      matchesSearch &&
      matchesSeverity &&
      matchesDashboardFilter
    );
  });

  function clearFilters() {
    setStatusFilter("All");
    setSeverityFilter("All");
    setSearch("");
    setSelectedReportId(null);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleDateString("en-GB");
  }

  function formatDateTime(dateValue) {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    return Number.isNaN(date.getTime())
      ? "—"
      : date.toLocaleString("en-GB");
  }

  function statusClass(status) {
    return (status || "Pending")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  }

  function getLocationText(location) {
    if (!location) return "Not provided";

    if (typeof location === "string") {
      try {
        const parsed = JSON.parse(location);

        if (parsed && typeof parsed === "object") {
          return parsed.address || "Not provided";
        }
      } catch {
        return location.trim() || "Not provided";
      }

      return "Not provided";
    }

    if (typeof location === "object") {
      return location.address || "Not provided";
    }

    return "Not provided";
  }

  function getLocationCoordinates(location) {
    if (!location) return null;

    let parsedLocation = location;

    if (typeof location === "string") {
      try {
        parsedLocation = JSON.parse(location);
      } catch {
        return null;
      }
    }

    if (!parsedLocation || typeof parsedLocation !== "object") {
      return null;
    }

    const latitudeValue =
      parsedLocation.latitude ?? parsedLocation.lat;

    const longitudeValue =
      parsedLocation.longitude ?? parsedLocation.lng;

    if (
      latitudeValue == null ||
      longitudeValue == null ||
      String(latitudeValue).trim() === "" ||
      String(longitudeValue).trim() === ""
    ) {
      return null;
    }

    const latitude = Number(latitudeValue);
    const longitude = Number(longitudeValue);

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

    return { latitude, longitude };
  }

  function renderPhotoTile(url, label, alt) {
    return (
      <div className="comparison-photo" key={label}>
        <strong className="comparison-photo-label">
          {label}
        </strong>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={url}
              alt={alt}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </a>
        ) : (
          <div className="report-photo-placeholder">
            <span>📷</span>
            <span>No photo</span>
          </div>
        )}
      </div>
    );
  }

  function renderPhotoComparison(report) {
    return (
      <div className="report-photo-comparison">
        {renderPhotoTile(
          report.imageUrl,
          "Before",
          `Original pothole: ${report.title}`
        )}

        {renderPhotoTile(
          report.repairedImageUrl,
          "After",
          `Repaired road: ${report.title}`
        )}
      </div>
    );
  }

  function renderReportDetails(report) {
    const coords = getLocationCoordinates(report.location);

    const mapsUrl = coords
      ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
      : null;

    return (
      <div className="report-details-panel">
        <div className="report-details-heading">
          <div>
            <p className="eyebrow">REPORT DETAILS</p>
            <h3>{report.title || "Untitled report"}</h3>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setSelectedReportId(null)}
          >
            Close details ×
          </button>
        </div>

        <div className="report-detail-grid">
          <div className="report-detail-item">
            <span>Description</span>
            <p>{report.description || "Not provided"}</p>
          </div>

          <div className="report-detail-item">
            <span>Location</span>
            <p>{getLocationText(report.location)}</p>

            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                📍 Open in Google Maps
              </a>
            )}
          </div>

          <div className="report-detail-item">
            <span>Severity</span>
            <p>
              <span
                className={`severity-badge ${getNormalizedSeverity(report)}`}
              >
                {report.severity || "Medium"}
              </span>
            </p>
          </div>

          <div className="report-detail-item">
            <span>Status</span>
            <p>
              <span
                className={`status-badge ${statusClass(report.status)}`}
              >
                {report.status || "Pending"}
              </span>
            </p>
          </div>

          <div className="report-detail-item">
            <span>Reported on</span>
            <p>
              {formatDateTime(
                report.createdAt || report.created_at
              )}
            </p>
          </div>

          <div className="report-detail-item">
            <span>Reported by</span>
            <p>{report.createdByEmail || "Not available"}</p>
          </div>
        </div>

        <h4 className="comparison-heading">
          Before and after photos
        </h4>

        {renderPhotoComparison(report)}

        {isRepaired(report) && (
          <div className="repair-details">
            <h4>Repair information</h4>

            <div className="report-detail-grid">
              <div className="report-detail-item">
                <span>Repair description</span>
                <p>
                  {report.repairDescription || "Not provided"}
                </p>
              </div>

              <div className="report-detail-item">
                <span>Repaired on</span>
                <p>{formatDateTime(report.repairedAt)}</p>
              </div>

              <div className="report-detail-item">
                <span>Repaired by</span>
                <p>{report.repairedBy || "Not available"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderReportsTable(items) {
    if (loading) {
      return (
        <div className="empty-state">
          Loading reports...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">⌕</div>
          <h3>No reports found</h3>
          <p>Try another search or filter.</p>

          {(statusFilter !== "All" ||
            severityFilter !== "All" ||
            search) && (
            <button
              type="button"
              className="secondary-button"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>BEFORE / AFTER</th>
              <th>REPORT</th>
              <th>LOCATION</th>
              <th>SEVERITY</th>
              <th>STATUS</th>
              <th>DATE</th>
              {isOfficer && <th>ACTION</th>}
            </tr>
          </thead>

          <tbody>
            {items.map((report) => {
              const reportId =
                report._id || report.id || report.title;

              const isRepairing =
                repairingReportId === report._id;

              const isSelected =
                selectedReportId === reportId;

              const coords =
                getLocationCoordinates(report.location);

              const mapsUrl = coords
                ? `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`
                : null;

              return (
                <Fragment key={reportId}>
                  <tr
                    className={`report-table-row ${
                      isSelected ? "selected-report-row" : ""
                    }`}
                    onClick={() =>
                      setSelectedReportId(
                        isSelected ? null : reportId
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        event.preventDefault();

                        setSelectedReportId(
                          isSelected ? null : reportId
                        );
                      }
                    }}
                    tabIndex={0}
                    aria-expanded={isSelected}
                    title="Click to view full report details"
                  >
                    <td>
                      <div className="table-photo-pair">
                        {report.imageUrl ? (
                          <img
                            className="table-thumbnail"
                            src={report.imageUrl}
                            alt="Before repair"
                            loading="lazy"
                          />
                        ) : (
                          <div className="table-thumbnail-placeholder">
                            No before photo
                          </div>
                        )}

                        {report.repairedImageUrl ? (
                          <img
                            className="table-thumbnail"
                            src={report.repairedImageUrl}
                            alt="After repair"
                            loading="lazy"
                          />
                        ) : (
                          <div className="table-thumbnail-placeholder">
                            Not repaired
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="report-name">
                        <div>
                          <strong>{report.title}</strong>
                          <p>{report.description}</p>

                          <span className="view-details-hint">
                            {isSelected
                              ? "Hide details ↑"
                              : "View details →"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="report-location-cell">
                        <span>
                          {getLocationText(report.location)}
                        </span>

                        {mapsUrl && (
                          <a
                            className="view-map-link"
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            📍 View in Maps
                          </a>
                        )}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`severity-badge ${getNormalizedSeverity(report)}`}
                      >
                        {report.severity || "Medium"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${statusClass(report.status)}`}
                      >
                        {report.status || "Pending"}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        report.createdAt || report.created_at
                      )}
                    </td>

                    {isOfficer && (
                      <td>
                        {!isRepaired(report) ? (
                          <button
                            type="button"
                            className="primary-button"
                            onClick={(event) => {
                              event.stopPropagation();

                              setRepairingReportId(
                                isRepairing ? null : report._id
                              );

                              setSelectedReportId(reportId);
                              resetRepairForm();
                              setError("");
                              setSuccess("");
                            }}
                          >
                            {isRepairing
                              ? "Cancel"
                              : "Mark repaired"}
                          </button>
                        ) : (
                          <span>Completed</span>
                        )}
                      </td>
                    )}
                  </tr>

                  {(isSelected ||
                    (isOfficer && isRepairing)) && (
                    <tr className="report-expanded-row">
                      <td colSpan={isOfficer ? 7 : 6}>
                        {isSelected &&
                          renderReportDetails(report)}

                        {isOfficer && isRepairing && (
                          <form
                            className="repair-form"
                            onSubmit={(event) =>
                              handleRepairSubmit(
                                event,
                                report._id
                              )
                            }
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <h3>Update repair details</h3>

                            <div className="form-group">
                              <label
                                htmlFor={`repair-notes-${reportId}`}
                              >
                                Repair notes *
                              </label>

                              <textarea
                                id={`repair-notes-${reportId}`}
                                value={repairDescription}
                                onChange={(event) =>
                                  setRepairDescription(
                                    event.target.value
                                  )
                                }
                                placeholder="Describe the repair work completed..."
                                rows={3}
                                required
                                disabled={repairSubmitting}
                              />
                            </div>

                            <div className="form-group">
                              <label
                                htmlFor={`repair-image-${reportId}`}
                              >
                                Repaired road photo *
                              </label>

                              <div className="upload-placeholder">
                                <span className="upload-icon">
                                  ＋
                                </span>

                                <div>
                                  <strong>
                                    Upload repaired-road photo
                                  </strong>

                                  <p>
                                    Choose a JPG, PNG or WEBP image
                                    (maximum 5 MB).
                                  </p>

                                  <input
                                    id={`repair-image-${reportId}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={
                                      handleRepairedImageChange
                                    }
                                    disabled={repairSubmitting}
                                    required
                                  />

                                  {repairedImageFile && (
                                    <div>
                                      <p>
                                        Selected:{" "}
                                        {repairedImageFile.name}
                                      </p>

                                      {repairedImagePreview && (
                                        <img
                                          src={repairedImagePreview}
                                          alt="Repaired road preview"
                                          className="selected-image-preview"
                                        />
                                      )}

                                      <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => {
                                          setRepairedImageFile(null);
                                          setError("");
                                        }}
                                        disabled={repairSubmitting}
                                      >
                                        Remove photo
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <p className="field-help">
                                The photo will be uploaded securely
                                when you confirm the repair.
                              </p>
                            </div>

                            <button
                              type="submit"
                              className="primary-button"
                              disabled={repairSubmitting}
                            >
                              {repairSubmitting
                                ? "Uploading and saving..."
                                : "Confirm repair"}
                            </button>

                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => {
                                setRepairingReportId(null);
                                resetRepairForm();
                              }}
                              disabled={repairSubmitting}
                            >
                              Cancel repair update
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  function renderDashboard() {
    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">OVERVIEW</p>
            <h1>Dashboard</h1>
            <p className="page-subtitle">
              Monitor road issues and track maintenance reports.
            </p>
          </div>

          {isCitizen && (
            <button
              className="primary-button"
              onClick={() => {
                setError("");
                setSuccess("");
                setActivePage("Report Pothole");
              }}
            >
              + New report
            </button>
          )}
        </div>

        <div className="stats-grid">
          <div
            className={`stat-card clickable-stat-card ${
              statusFilter === "All"
                ? "active-stat-card"
                : ""
            }`}
            role="button"
            tabIndex={0}
            title="View all reports"
            onClick={() => handleDashboardCardClick("All")}
            onKeyDown={(event) =>
              handleCardKeyDown(event, "All")
            }
          >
            <div className="stat-top">
              <span>Total Reports</span>
              <span className="stat-icon purple">▤</span>
            </div>

            <h2>{reports.length}</h2>
            <p>All reported road issues</p>
            <span className="stat-click-hint">
              Click to view reports →
            </span>
          </div>

          <div
            className={`stat-card clickable-stat-card ${
              statusFilter === "Pending"
                ? "active-stat-card"
                : ""
            }`}
            role="button"
            tabIndex={0}
            title="View pending reports"
            onClick={() => handleDashboardCardClick("Pending")}
            onKeyDown={(event) =>
              handleCardKeyDown(event, "Pending")
            }
          >
            <div className="stat-top">
              <span>Pending</span>
              <span className="stat-icon orange">◷</span>
            </div>

            <h2>{pendingCount}</h2>
            <p>Awaiting maintenance</p>
            <span className="stat-click-hint">
              Click to view reports →
            </span>
          </div>

          <div
            className={`stat-card clickable-stat-card ${
              statusFilter === "Repaired"
                ? "active-stat-card"
                : ""
            }`}
            role="button"
            tabIndex={0}
            title="View repaired reports"
            onClick={() => handleDashboardCardClick("Repaired")}
            onKeyDown={(event) =>
              handleCardKeyDown(event, "Repaired")
            }
          >
            <div className="stat-top">
              <span>Repaired</span>
              <span className="stat-icon green">✓</span>
            </div>

            <h2>{resolvedCount}</h2>
            <p>Issues marked repaired</p>
            <span className="stat-click-hint">
              Click to view reports →
            </span>
          </div>

          <div
            className={`stat-card clickable-stat-card ${
              statusFilter === "High Priority"
                ? "active-stat-card"
                : ""
            }`}
            role="button"
            tabIndex={0}
            title="View high and critical reports"
            onClick={() =>
              handleDashboardCardClick("High Priority")
            }
            onKeyDown={(event) =>
              handleCardKeyDown(event, "High Priority")
            }
          >
            <div className="stat-top">
              <span>High Priority</span>
              <span className="stat-icon red">!</span>
            </div>

            <h2>{highPriorityCount}</h2>
            <p>High or critical severity</p>
            <span className="stat-click-hint">
              Click to view reports →
            </span>
          </div>
        </div>

        {error && (
          <div className="alert error-alert" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success-alert" role="status">
            {success}
          </div>
        )}

        <section className="content-card">
          <div className="section-heading">
            <div>
              <h2>Recent Reports</h2>
              <p>
                Click any report to see its complete details.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => {
                clearFilters();
                setActivePage("Reports");
              }}
            >
              View all →
            </button>
          </div>

          {renderReportsTable(reports.slice(0, 5))}
        </section>
      </>
    );
  }

  function renderReportForm() {
    if (!isCitizen) {
      return (
        <section className="content-card">
          <h2>Citizen access only</h2>
          <p>
            Only citizens can submit new pothole reports.
          </p>
        </section>
      );
    }

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">ROAD MAINTENANCE</p>
            <h1>Report Pothole</h1>
            <p className="page-subtitle">
              Provide details so the maintenance team can investigate.
            </p>
          </div>
        </div>

        <section className="form-card">
          <div className="form-heading">
            <div className="form-heading-icon">＋</div>
            <div>
              <h2>Submit a Road Issue</h2>
              <p>Fields marked with * are required.</p>
            </div>
          </div>

          {error && (
            <div className="alert error-alert" role="alert">
              {error}
              <button
                type="button"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="alert success-alert" role="status">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Report title *</label>
              <input
                id="title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="e.g. Large pothole near college gate"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Pothole Location *</label>

              <button
                type="button"
                className="secondary-button location-button"
                onClick={handleGetCurrentLocation}
                disabled={locationLoading || submitting}
              >
                {locationLoading
                  ? "Detecting location..."
                  : "📍 Use My Current Location"}
              </button>

              <input
                id="address"
                value={address}
                onChange={(event) => {
                  setAddress(event.target.value);
                  setCoordinates(null);
                }}
                placeholder="Detect your location or enter an address"
                required
              />

              {coordinates && (
                <p className="field-help">
                  GPS: {coordinates.latitude.toFixed(6)},{" "}
                  {coordinates.longitude.toFixed(6)}
                </p>
              )}

              <p className="field-help">
                Allow location access in your browser. You can also
                enter the address manually.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe the pothole and road condition..."
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="severity">Severity *</label>
              <select
                id="severity"
                value={severity}
                onChange={(event) =>
                  setSeverity(event.target.value)
                }
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <p className="field-help">
                Choose how serious the road issue is.
              </p>
            </div>

            <div className="upload-placeholder">
              <span className="upload-icon">＋</span>

              <div>
                <strong>Upload pothole photo</strong>
                <p>
                  Choose a JPG, PNG or WEBP image (maximum 5 MB).
                </p>

                <input
                  id="pothole-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  disabled={submitting}
                />

                {imageFile && (
                  <div>
                    <p>Selected: {imageFile.name}</p>

                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Pothole preview"
                        className="selected-image-preview"
                      />
                    )}

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setImageFile(null)}
                      disabled={submitting}
                    >
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  resetForm();
                  setError("");
                  setSuccess("");
                }}
                disabled={submitting}
              >
                Clear form
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit report →"}
              </button>
            </div>
          </form>
        </section>
      </>
    );
  }

  function renderReportsPage() {
    const filterLabels = {
      All: "All Reports",
      Pending: "Pending Reports",
      Repaired: "Repaired Reports",
      "High Priority": "High Priority Reports",
    };

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">ROAD MAINTENANCE</p>
            <h1>{filterLabels[statusFilter] || "All Reports"}</h1>
            <p className="page-subtitle">
              Click a report to view all details. Filter reports by severity.
            </p>
          </div>

          {isCitizen && (
            <button
              className="primary-button"
              onClick={() => {
                setError("");
                setSuccess("");
                setActivePage("Report Pothole");
              }}
            >
              + New report
            </button>
          )}
        </div>

        {error && (
          <div className="alert error-alert" role="alert">
            {error}
            <button
              type="button"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="alert success-alert" role="status">
            {success}
          </div>
        )}

        <section className="content-card">
          <div className="section-heading reports-toolbar">
            <div>
              <h2>Road Reports</h2>
              <p>
                {filteredReports.length} matching report(s) out of{" "}
                {reports.length}
              </p>

              {statusFilter !== "All" && (
                <p className="active-filter-label">
                  Dashboard filter:{" "}
                  <strong>{statusFilter}</strong>
                </p>
              )}
            </div>

            <div className="table-actions">
              <input
                className="search-input"
                type="search"
                placeholder="Search reports..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

              <select
                className="severity-filter"
                aria-label="Filter reports by severity"
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value)
                }
              >
                <option value="All">All Severities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <button
                className="secondary-button"
                onClick={() => {
                  clearFilters();
                  fetchReports();
                }}
                disabled={loading}
              >
                ↻ {loading ? "Refreshing..." : "Clear filters"}
              </button>
            </div>
          </div>

          {renderReportsTable(filteredReports)}
        </section>
      </>
    );
  }

  function renderAnalyticsPage() {
    const summary = analytics?.summary || {
      total: reports.length,
      pending: pendingCount,
      repaired: resolvedCount,
    };

    const severityData = Object.entries(
      analytics?.severity || {}
    ).map(([name, value]) => ({
      name,
      count: value,
    }));

    const locationData = (analytics?.locations || [])
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({
        address: item.address,
        count: item.count,
        label:
          item.address.length > 32
            ? `${item.address.slice(0, 29)}...`
            : item.address,
      }));

    const severityColors = {
      Low: "#22c55e",
      Medium: "#f59e0b",
      High: "#f97316",
      Critical: "#ef4444",
    };

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">DATA INSIGHTS</p>
            <h1>Analytics Dashboard</h1>
            <p className="page-subtitle">
              Report statistics and road hotspots analyzed using Hadoop.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={() => {
              fetchAnalytics();
              fetchReports();
            }}
            disabled={analyticsLoading || loading}
          >
            ↻ {analyticsLoading || loading
              ? "Refreshing..."
              : "Refresh data"}
          </button>
        </div>

        {analyticsError && (
          <div className="alert error-alert" role="alert">
            {analyticsError}
          </div>
        )}

        {analyticsLoading && !analytics && (
          <section className="content-card">
            Loading analytics data...
          </section>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-top">
              <span>Total Reports</span>
              <span className="stat-icon purple">▤</span>
            </div>
            <h2>{summary.total}</h2>
            <p>Reports stored in MongoDB</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Pending Issues</span>
              <span className="stat-icon orange">◷</span>
            </div>
            <h2>{summary.pending}</h2>
            <p>Waiting for maintenance</p>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>Repaired Issues</span>
              <span className="stat-icon green">✓</span>
            </div>
            <h2>{summary.repaired}</h2>
            <p>Completed maintenance</p>
          </div>
        </div>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <h2>Analytics Pipeline</h2>
              <p>Data flow from reports to big-data analysis.</p>
            </div>
          </div>

          <div className="pipeline-grid">
            <div className="pipeline-card">
              <span className="pipeline-number">01</span>
              <h3>React Frontend</h3>
              <p>Collects and displays road reports.</p>
              <span className="pipeline-status active">
                Implemented
              </span>
            </div>

            <div className="pipeline-card">
              <span className="pipeline-number">02</span>
              <h3>MongoDB + Express</h3>
              <p>Stores reports and serves analytics data.</p>
              <span className="pipeline-status active">
                Connected
              </span>
            </div>

            <div className="pipeline-card">
              <span className="pipeline-number">03</span>
              <h3>AWS S3</h3>
              <p>Stores uploaded road images.</p>
              <span className="pipeline-status active">
                Integrated
              </span>
            </div>

            <div className="pipeline-card">
              <span className="pipeline-number">04</span>
              <h3>Hadoop Analytics</h3>
              <p>Counts reports by location to identify hotspots.</p>
              <span
                className={`pipeline-status ${
                  analytics?.hadoopAvailable ? "active" : "planned"
                }`}
              >
                {analytics?.hadoopAvailable
                  ? "Output loaded"
                  : "Unavailable"}
              </span>
            </div>
          </div>

          {analytics?.hadoopMessage && (
            <p className="field-help">
              {analytics.hadoopMessage}
            </p>
          )}
        </section>

        <div className="analytics-chart-grid">
          <section className="content-card analytics-chart-card">
            <div className="section-heading">
              <div>
                <h2>Report Severity</h2>
                <p>Distribution of reports by severity.</p>
              </div>
            </div>

            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, count }) => `${name}: ${count}`}
                  >
                    {severityData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={severityColors[entry.name] || "#64748b"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No severity data available yet.</p>
            )}
          </section>

          <section className="content-card analytics-chart-card">
            <div className="section-heading">
              <div>
                <h2>Top Pothole Hotspots</h2>
                <p>Locations ranked by Hadoop report counts.</p>
              </div>
            </div>

            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={locationData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={125}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(value) => [value, "Reports"]}
                    labelFormatter={(label, items) =>
                      items?.[0]?.payload?.address || label
                    }
                  />
                  <Bar
                    dataKey="count"
                    name="Reports"
                    fill="#6366f1"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No Hadoop location counts available.</p>
            )}
          </section>
        </div>

        <section className="content-card analytics-table">
          <div className="section-heading">
            <div>
              <h2>Hadoop Location Counts</h2>
              <p>
                {analytics?.hadoopAvailable
                  ? `${analytics.locations.length} distinct address strings in the Hadoop output.`
                  : "Hadoop results are not currently available."}
              </p>
            </div>
          </div>

          {(analytics?.locations || []).length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>LOCATION</th>
                    <th>REPORT COUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.locations
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((item, index) => (
                      <tr key={`${item.address}-${index}`}>
                        <td>{index + 1}</td>
                        <td>{item.address}</td>
                        <td>
                          <strong>{item.count}</strong>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>
              No location counts to display. Check that the Hadoop
              job has generated its output file.
            </p>
          )}
        </section>
      </>
    );
  }

  if (!authData) {
    return <Auth onLogin={handleLogin} />;
  }

  const navItems = [
    { name: "Dashboard", icon: "▦" },
    ...(isCitizen
      ? [{ name: "Report Pothole", icon: "＋" }]
      : []),
    { name: "Reports", icon: "▤" },
    { name: "Analytics", icon: "▥" },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">R</div>
          <div>
            <h2>RoadCare</h2>
            <p>Dashboard</p>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => {
                setActivePage(item.name);
                setError("");
                setSuccess("");
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.name}</span>

              {item.name === "Reports" &&
                reports.length > 0 && (
                  <span className="nav-count">
                    {reports.length}
                  </span>
                )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-avatar">
            {(authData.user?.name || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <strong>{authData.user?.name || "User"}</strong>
            <p>{isOfficer ? "Officer" : "Citizen"}</p>
          </div>

          <button
            type="button"
            className="admin-menu"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span
              className={`connection-dot ${
                error ? "offline" : ""
              }`}
            />

            <span className="connection-text">
              {error ? "Connection issue" : "RoadCare System"}
            </span>

            <div className="topbar-avatar">
              {(authData.user?.name || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {activePage === "Dashboard" && renderDashboard()}
          {activePage === "Report Pothole" && renderReportForm()}
          {activePage === "Reports" && renderReportsPage()}
          {activePage === "Analytics" && renderAnalyticsPage()}
        </div>

        <footer className="app-footer">
          <span>RoadCare © 2026</span>
          <span>
            Pothole Detection &amp; Road Maintenance System
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
