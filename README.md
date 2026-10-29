# RoadCare – Pothole Detection and Road Maintenance System

## 🌐 Live Demo

**Live Website:** [RoadCare – Open Application](https://pothole-detection-ivory.vercel.app)

RoadCare is a web-based road maintenance system that helps citizens report potholes and allows road maintenance teams to monitor reported issues, track repairs, and analyze road conditions.

## 📌 Overview

Potholes can cause road accidents, vehicle damage, traffic congestion, and safety problems. RoadCare provides a centralized platform for reporting potholes and monitoring maintenance activities.

The system combines a web application, cloud storage, database management, and Big Data Analytics to organize road issue reports and support maintenance planning.

## 🎯 Objectives

- Provide an easy way to report potholes.
- Store and manage road maintenance reports.
- Allow users to monitor report status.
- Store report images using AWS S3.
- Analyze pothole reports using Hadoop MapReduce.
- Identify locations with recurring road issues.
- Support better road maintenance planning through data analysis.

## ✨ Features

### 1. Dashboard
- Display total pothole reports.
- Show pending and repaired reports.
- Highlight high-priority road issues.
- Display recent reports.

### 2. Pothole Reporting
- Submit new pothole reports.
- Provide report details and location information.
- Upload images of road conditions.
- Record the severity of road issues.

### 3. Report Management
- View submitted reports.
- Track maintenance status.
- Update reports when repairs are completed.
- View individual report details.

### 4. Analytics
- Display road issue statistics.
- Analyze report information.
- Support location-wise pothole analysis.
- Identify areas that may require maintenance attention.

### 5. Cloud Integration
- Deploy the web application using Vercel.
- Store report information in MongoDB Atlas.
- Use AWS S3 for image storage.

### 6. Big Data Processing
- Export report data into CSV format.
- Process data using Hadoop Streaming.
- Use Python Mapper and Reducer scripts.
- Calculate location-wise pothole report counts.

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript/TypeScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Image Storage | AWS S3 |
| Cloud Deployment | Vercel |
| Big Data Processing | Apache Hadoop |
| Data Processing | Hadoop Streaming |
| Analytics Scripts | Python |
| Data Export | CSV |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

```text
                 Citizens / Road Officers
                           |
                           v
                  React + Vite Frontend
                           |
                           v
                    Node.js + Express
                      /           \
                     v             v
              MongoDB Atlas      AWS S3
              Report Data       Report Images
                     |
                     v
                CSV Data Export
                     |
                     v
              Hadoop Streaming
                     |
              Python Mapper
                     |
                     v
              Python Reducer
                     |
                     v
          Location-wise Report Counts
```

## 📂 Project Structure

```text
PotholeDetection/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.*
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   └── app.js
│   ├── package.json
│   └── .env
│
├── analytics/
│
├── docs/
│
├── hadoop/
│   ├── input/
│   ├── mapper.py
│   ├── reducer.py
│   └── output/
│
├── scripts/
│   └── export_reports.js
│
├── sample-data/
│
├── .gitignore
├── README.md
└── requirements.md
```

*Note: The structure above describes the main project components. Some filenames or folders may differ depending on the current repository version.*

## ⚙️ Prerequisites

Install or configure the following tools before running the project locally:

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
- [AWS Account](https://aws.amazon.com/) for S3 integration
- [Python](https://www.python.org/)
- [Apache Hadoop](https://hadoop.apache.org/) for MapReduce processing
- Visual Studio Code or another code editor

## 🚀 Run the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/karthik9724/PotholeDetection.git
cd PotholeDetection
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

Create a `.env` file inside the `server` directory and configure the required environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=your_token_expiry
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
```

Replace the example values with your own configuration. Never commit real credentials or secret keys to GitHub.

Start the backend:

```bash
npm run dev
```

### 3. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

Create a frontend `.env` file if your local configuration requires it:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

### 4. Configure External Services

Before using all features locally, ensure that:

- MongoDB Atlas is accessible from the backend.
- The required database connection string is configured.
- AWS S3 credentials and bucket permissions are configured.
- The frontend API URL points to the running backend.

## ☁️ Deployment

RoadCare is deployed using Vercel.

- **Frontend:** [https://pothole-detection-ivory.vercel.app](https://pothole-detection-ivory.vercel.app)
- **Backend API:** [https://pothole-detection-vtyt.vercel.app](https://pothole-detection-vtyt.vercel.app)
- **GitHub Repository:** [https://github.com/karthik9724/PotholeDetection](https://github.com/karthik9724/PotholeDetection)

### Deployment Configuration

Configure the following environment variables in the appropriate deployment settings:

**Frontend**
- `VITE_API_URL`

**Backend**
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Keep secret values in the hosting provider's environment-variable settings. Do not add them to source code or public documentation.

## 📊 Big Data Analytics with Hadoop

RoadCare can process exported report data to summarize pothole reports by location.

The general workflow is:

1. Retrieve report information from MongoDB.
2. Export the data to CSV.
3. Prepare the input data for Hadoop Streaming.
4. Run the Python Mapper to extract location information.
5. Run the Python Reducer to aggregate counts.
6. Review the location-wise output.

### Export Report Data

From the backend directory, if the export script and its dependencies are configured:

```bash
node scripts/export_reports.js
```

Ensure that the script's actual path and output location match your repository.

### Hadoop Streaming

Hadoop Streaming allows Python scripts to process data using the Mapper and Reducer model.

- **Mapper:** Reads input records and emits location-based key-value pairs.
- **Reducer:** Groups matching locations and calculates report counts.
- **Output:** Provides aggregated counts for further analysis.

The exact Hadoop command depends on the installed Hadoop version, the Streaming JAR location, and the actual input and script paths.

## 🔐 Security

- Store passwords and credentials securely.
- Keep `.env` files out of version control.
- Use appropriate MongoDB access permissions.
- Restrict AWS S3 permissions to the resources the application needs.
- Validate user inputs on the backend.
- Use secure authentication and authorization.
- Avoid exposing secret values in logs or public repositories.

## 🔮 Future Enhancements

- Integrate GPS-based pothole detection.
- Add interactive road issue maps.
- Introduce automated image-based pothole detection.
- Provide notifications for report status changes.
- Improve recurring-location analysis.
- Add maintenance team assignment and scheduling.
- Develop more detailed analytics dashboards.
- Explore predictive maintenance using historical report data.

## 👨‍💻 Author

**Karthik Naidu**

B.Tech – Computer Science and Engineering

GitHub: [karthik9724](https://github.com/karthik9724)
