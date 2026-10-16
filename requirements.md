# Pothole Detection and Road Maintenance System Using Cloud Computing and Big Data Analytics

## 1. Project Overview

The Pothole Detection and Road Maintenance System is a web-based application that allows citizens to report potholes and helps road maintenance officers manage repair activities.

The system stores pothole reports and images, tracks repair status, and uses Hadoop MapReduce to analyze pothole reports by location.

## 2. Project Objectives

- Allow citizens to submit pothole reports with descriptions, images, and locations.
- Store report information in MongoDB Atlas.
- Store uploaded pothole images in Amazon S3.
- Allow officers to update repair status.
- Display summary statistics and location-based analytics.
- Use Hadoop MapReduce to identify locations with repeated pothole reports.
- Provide a dashboard to monitor reports and repair progress.

## 3. Technologies and Tools Used

### Frontend
- React.js
- Vite
- JavaScript / JSX
- HTML and CSS
- Recharts for charts and data visualization

### Backend
- Node.js
- Express.js
- REST API
- MongoDB Node.js driver

### Database
- MongoDB Atlas — cloud database for pothole reports and application data.

### Cloud Storage
- Amazon Web Services (AWS) S3 — storage for uploaded pothole images.

### Big Data Analytics
- Apache Hadoop 3.4.2
- Hadoop Streaming
- Python 3
- Python CSV module
- MapReduce programming model

### Development Tools
- Visual Studio Code
- Git
- GitHub
- Windows and WSL Ubuntu
- npm for Node.js package management

## 4. System Architecture

1. Citizens submit pothole reports through the React frontend.
2. The Express backend validates requests and processes report data.
3. Report information is stored in MongoDB Atlas.
4. Pothole images are uploaded to Amazon S3.
5. An export script retrieves reports from MongoDB and writes them to a CSV file.
6. Hadoop Streaming executes a Python mapper and reducer to count reports by location.
7. The Express analytics API returns report summaries and Hadoop results.
8. The frontend dashboard displays report statistics, severity information, and location-based analytics.

## 5. Main Functional Modules

### Citizen Reporting
- Submit pothole details.
- Include a description and location.
- Upload an image.
- Save the report in the database.

### Officer Repair Management
- View pothole reports.
- Update repair status.
- Track pending and completed repairs.

### Cloud Image Storage
- Upload images to Amazon S3.
- Retrieve stored images when displaying reports.

### Analytics Dashboard
- Display total reports.
- Show pending and repaired counts.
- Summarize reports by severity.
- Display location-wise pothole counts from Hadoop output.

### Big Data Processing
- Export database records to CSV.
- Process records using Hadoop Streaming.
- Use a Python mapper to emit location and count pairs.
- Use a Python reducer to aggregate counts by exact address.
- Save results to the Hadoop output directory.

## 6. Project Folder Structure

- `client/` — React frontend.
- `server/` — Express backend and API routes.
- `server/src/config/` — database and configuration code.
- `server/src/routes/` — API route handlers.
- `scripts/export_reports.js` — exports MongoDB reports to CSV.
- `hadoop/input/` — CSV input for Hadoop.
- `hadoop/mapper/` — Python mapper.
- `hadoop/reducer/` — Python reducer.
- `hadoop/output/` — generated Hadoop output; excluded from Git.
- `sample-data/` — sample dataset.
- `analytics/` — analytics-related resources.
- `docs/` — project documentation.

## 7. Setup Requirements

Install or configure the following:

- Node.js and npm.
- MongoDB Atlas account and database.
- AWS account with an S3 bucket and appropriate permissions.
- Python 3.
- Apache Hadoop 3.4.2 and Java compatible with the Hadoop setup.
- Git and Visual Studio Code.

## 8. Environment Configuration

The backend uses a local `.env` file for configuration, including database connection details and AWS settings.

**Security:** Never commit `.env` files, passwords, database connection strings, AWS access keys, or secret keys to GitHub.

Configure the required environment variables on the deployment platform. Keep only safe placeholder values in any example environment file.

## 9. Running the Application Locally

1. Install frontend dependencies inside `client/`.
2. Install backend dependencies inside `server/`.
3. Configure the backend `.env` file.
4. Start the Express backend.
5. Start the React development server.
6. Open the frontend in a browser and test report submission and analytics.

## 10. Running Big Data Analytics

1. Export the latest reports from MongoDB using `scripts/export_reports.js`.
2. Verify the generated `hadoop/input/pothole_reports.csv`.
3. Run the Hadoop Streaming job with the Python mapper and reducer.
4. Inspect `hadoop/output/live_location_counts/part-00000`.
5. Request the Express analytics API to verify that the latest Hadoop results are available.

## 11. Testing and Verification

The following workflows have been tested locally:

- Citizen report submission.
- Persistence of reports in MongoDB.
- Image storage and retrieval using Amazon S3.
- Officer repair-status updates.
- Analytics dashboard updates.
- Validation of invalid report submissions.
- Persistence after browser refresh and backend restart.
- CSV export from MongoDB.
- Hadoop location-wise aggregation.
- Successful analytics API response with HTTP 200.

## 12. Deployment Plan

- Push source code to GitHub without credentials or generated files.
- Deploy the backend to a Node.js-compatible hosting service.
- Configure environment variables and cloud service permissions.
- Deploy the frontend to a static hosting service.
- Configure the frontend API URL to use the deployed backend.
- Test the complete application using the deployed URLs.

## 13. Expected Outcome

The system provides a centralized way to report potholes, manage repair progress, store images in cloud storage, and analyze frequently reported locations using big data processing.