# RoadCare — System Requirements

## 1. Purpose

This document defines the functional requirements, non-functional requirements, software dependencies, and external service requirements for the RoadCare Pothole Detection and Road Maintenance System.

The system supports pothole reporting, report management, cloud image storage, and location-based analysis of report data using Hadoop MapReduce.

## 2. Functional Requirements

### FR-01: Pothole Report Submission

The system shall provide an interface for users to submit pothole reports with the details supported by the application, such as a title, description, and location.

### FR-02: Report Storage

The system shall store pothole report information in MongoDB and make stored reports available through the implemented API.

### FR-03: Image Upload

The system shall support uploading pothole images to a configured Amazon S3 bucket, subject to the application's upload implementation and AWS permissions.

### FR-04: Report Retrieval

The system shall allow users with the appropriate access to retrieve and view available pothole reports.

### FR-05: Repair Status Management

The system shall support updating the repair status of a report through the implemented report-management workflow.

### FR-06: Data Export

The system shall provide a mechanism to export report data from MongoDB into CSV format for further processing.

### FR-07: Big Data Processing

The system shall support processing CSV report data using Hadoop Streaming and Python mapper and reducer scripts.

### FR-08: Location-wise Analysis

The analytics workflow shall calculate the number of pothole reports for each location based on the input data and the implemented MapReduce logic.

### FR-09: Web Interface

The system shall provide a browser-based interface for interacting with the available reporting and report-management features.

## 3. Non-Functional Requirements

### NFR-01: Usability

The user interface should be clear and straightforward so that users can submit and review pothole reports without unnecessary complexity.

### NFR-02: Reliability

The application should handle database, API, cloud-storage, and data-processing errors appropriately and provide useful error information where implemented.

### NFR-03: Security

- Sensitive credentials shall be kept out of source control.
- Database and cloud-storage access shall use appropriate permissions.
- Protected operations shall enforce the authentication and authorization controls implemented by the application.
- User inputs and uploaded files should be validated.

### NFR-04: Maintainability

Frontend code, backend code, configuration, data-export scripts, and Hadoop processing scripts should remain organized into separate modules.

### NFR-05: Scalability

The use of MongoDB Atlas, Amazon S3, and Hadoop MapReduce provides components that can support growth in stored reports, images, and analytics workloads when configured and resourced appropriately.

### NFR-06: Portability

The web application should run in compatible Node.js environments. The Hadoop analytics workflow requires a compatible Hadoop and Python environment.

### NFR-07: Data Integrity

Report records and exported CSV data should preserve the fields and formats required by the application and analytics scripts.

## 4. Software Requirements

| Software / Service | Purpose |
|---|---|
| Windows | Primary development environment |
| WSL Ubuntu | Linux environment for Hadoop execution |
| Node.js | Backend runtime and JavaScript execution |
| npm | Installing JavaScript dependencies |
| React.js | Frontend interface |
| Vite | Frontend development and build tooling |
| Express.js | Backend REST API |
| MongoDB Atlas | Cloud database for report information |
| AWS S3 | Cloud storage for uploaded images |
| Python 3 | Hadoop mapper and reducer scripts |
| Apache Hadoop 3.4.2 | Big Data processing |
| Hadoop Streaming | Running Python scripts as MapReduce tasks |
| Git | Source-code version control |
| GitHub | Source-code hosting and collaboration |
| Visual Studio Code | Code editing and development |

Use compatible versions of the listed tools and verify the versions required by the project's package files and configuration.

## 5. External Service Requirements

### 5.1 MongoDB Atlas

- A MongoDB Atlas deployment must be available.
- A database connection string must be configured securely.
- The application must have permission to access the required database and collections.
- Network access must be configured to permit the application to connect.

### 5.2 Amazon S3

- An S3 bucket must exist in the configured AWS region.
- The backend must be configured with the correct bucket and region.
- AWS permissions must allow only the required image-storage operations.
- AWS credentials must be stored securely and must not be committed to the repository.

### 5.3 Hadoop Environment

- A compatible Hadoop installation must be available for analytics execution.
- Hadoop Streaming must be accessible.
- Python 3 must be installed in the execution environment.
- The mapper, reducer, and input CSV must be available at the configured paths.
- Each Hadoop run must use an output directory that does not already exist.

## 6. Data Requirements

### Input Data

The analytics workflow uses pothole report records exported to CSV format.

The expected local input file is:

```text
hadoop/input/pothole_reports.csv
```

The CSV must contain the fields expected by the export script, mapper, and reducer. The exact schema should be maintained consistently across these components.

### Output Data

The Hadoop workflow generates output containing location-wise report counts according to the implemented mapper and reducer logic.

Generated Hadoop output should be treated as derived data and should not be committed unless there is a specific reason to version a sample result.

## 7. Environment Configuration

The application requires configuration for the services it uses. Depending on the implementation, this may include:

- MongoDB connection settings.
- Authentication and token settings.
- AWS region and S3 bucket settings.
- AWS credentials or an alternative supported AWS credential provider.
- Frontend API base URL.

Use the exact environment variable names defined in the source code. Store local secrets in ignored environment files and provide only placeholder values in any example configuration file committed to GitHub.

## 8. Constraints and Assumptions

- Cloud features depend on valid service configuration, permissions, and network connectivity.
- Image upload requires a functioning S3 configuration.
- Database export requires access to the configured MongoDB database.
- Analytics results depend on the completeness and correctness of the input CSV.
- Location-wise counts reflect the location values in the source data; inconsistent location names may produce separate counts.
- Hadoop processing performance depends on the dataset size and the available computing resources.
- The available functionality is limited to features implemented in the current application.

## 9. Acceptance Criteria

The system can be considered functionally validated when the following applicable checks succeed:

1. The frontend can communicate with the backend.
2. A valid pothole report can be submitted and retrieved.
3. Report information is persisted in MongoDB.
4. Image upload works when AWS S3 is configured.
5. Report status can be updated through the implemented workflow.
6. Report data can be exported to CSV.
7. Hadoop Streaming can execute the mapper and reducer on valid input data.
8. The generated output contains the expected location-wise report counts.

## 10. Maintenance

This document should be updated whenever the project's features, APIs, data schema, technology stack, environment variables, or external service requirements change.
