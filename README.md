<<<<<<< HEAD
# Hospital Management System (HMS)

## Description
The **Hospital Management System (HMS)** is a full-stack application designed to manage patient information, appointments, and medical records in a hospital setting. The system allows administrators, doctors, receptionists, and lab technicians to manage data efficiently. This system uses MongoDB for database management and Node.js with Express.js for the backend.

## Technologies Used
<ul>
    <li><strong>Node.js</strong>: JavaScript runtime for the server-side code.</li>
    <li><strong>Express.js</strong>: Web framework for building RESTful APIs.</li>
    <li><strong>MongoDB</strong>: NoSQL database to store patient and other hospital-related data.</li>
    <li><strong>Mongoose</strong>: ODM for MongoDB to interact with the database.</li>
    <li><strong>CORS</strong>: Middleware to handle cross-origin requests.</li>
    <li><strong>Body-Parser</strong>: Middleware to parse incoming request bodies.</li>
</ul>

## Features
<ul>
    <li><strong>Role-Based Access Control</strong>: Different user roles (Admin, Doctor, Receptionist, Lab Technician) with specific permissions.</li>
    <li><strong>CRUD Operations</strong>: Perform Create, Read, Update, and Delete operations on patient data.</li>
    <li><strong>Custom Patient ID</strong>: Each patient has a unique custom ID generated based on timestamp and random number.</li>
    <li><strong>Patient Management</strong>: Admin can manage doctors, receptionists, and lab technicians, while doctors can add diagnoses and prescriptions for patients.</li>
    <li><strong>RESTful API</strong>: Exposes endpoints to interact with the system, including the ability to manage patients and view patient details using a custom ID.</li>
</ul>

2. Install Dependencies
Navigate to the project folder and install the necessary dependencies:

bash
Copy
Edit
npm install
3. Setup MongoDB
Ensure that MongoDB is running on your local machine. Alternatively, you can use a cloud database solution like MongoDB Atlas. If necessary, update the connection URL in the server.js file to match your database setup.

4. Run the Application
Start the backend server with the following command:

bash
Copy
Edit
npm start
The backend will be accessible at http://localhost:5000.

API Endpoints
1. POST /api/patients/add
Create a new patient record. Request Body:

json
Copy
Edit
{
    "name": "John Doe",
    "age": 30,
    "gender": "Male",
    "diagnosis": "Flu"
}
2. GET /api/patients
Retrieve a list of all patient records.

json
Copy
Edit
[
    {
        "_id": "5f8d0c5b2b1e6a3d4f3b8c21",
        "name": "John Doe",
        "age": 30,
        "gender": "Male",
        "diagnosis": "Flu",
        "admissionDate": "2025-02-02T17:53:11.540Z",
        "customId": "P-1738520236948-502"
    }
]
3. GET /api/patients/custom/:customId
Retrieve a specific patient record by their custom ID. Example URL:

bash
Copy
Edit
http://localhost:5000/api/patients/custom/P-1738520236948-502
4. PUT /api/patients/custom/:customId
Update a patient's details by their custom ID. Request Body:

json
Copy
Edit
{
    "name": "Jane Doe",
    "age": 32,
    "gender": "Female",
    "diagnosis": "Cold"
}
5. DELETE /api/patients/:id
Delete a patient record by their MongoDB generated ID. Example URL:

bash
Copy
Edit
http://localhost:5000/api/patients/5f8d0c5b2b1e6a3d4f3b8c21


<<<<<<< HEAD
=======
DELETE /api/patients/:id
Delete a patient by their MongoDB generated ID.
=======
# HospitalManagementSystemPersonal
Hospital Management System (HMS).  A robust and dynamic **Hospital Management System** developed using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js). This project is designed to streamline hospital operations, offering comprehensive management for patients, appointments, doctors,receptionists and Lab Technicients
>>>>>>> fe65c7fba92248830d09c180382d55799c86f0a9
