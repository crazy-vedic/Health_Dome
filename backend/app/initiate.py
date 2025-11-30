import mysql.connector
from faker import Faker
from random import choice, randint,random
from os import getenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')

# Establish connection to the MySQL server
def create_connection(host_name, user_name, user_password, db_name=None):
    connection = None
    try:
        connection = mysql.connector.connect(
            host=host_name,
            user=user_name,
            password=user_password,
            database=db_name
        )
        if connection.is_connected():
            logging.info("Connection to MySQL DB successful")
            return connection
        else:
            raise mysql.connector.Error("Connection to MySQL DB failed")
    except mysql.connector.Error as e:
        logging.error(f"The Exception '{e}' occurred")
        raise

# Execute a query
def execute_query(connection, query, data=None):
    if connection is None:  # Check if connection is valid
        logging.error("No valid connection. Cannot execute query.")
        return None
    cursor = connection.cursor()
    try:
        if data is None:
            cursor.execute(query)
        elif isinstance(data[0], tuple):
            cursor.executemany(query, data)
        else:
            cursor.execute(query, data)

        if cursor.with_rows:  # Check if the query has a result set
            result = cursor.fetchall()
            return result
        
        connection.commit()
        status_message = {
            "message": "Query OK",
            "rows_matched": cursor.rowcount,  # Rows matched would be the same as affected in most cases
            "warnings": [] if cursor.warning_count else cursor.warnings,  # Fetch warnings, if any
            "query": query.strip().replace('\n', ' ').strip(),
            "data": data
        }
        return status_message
    except Exception as e:
        logging.error("While executing"+query.strip().replace('\n', ' ').strip()[:100])
        logging.error(f"The Exception '{e}' occurred")
        raise
    finally:
        cursor.close()  # Ensure the cursor is closed after use
        
def insert_random_data(connection, insert_patients=False, insert_beds=False, insert_history=False, insert_medicines=False, insert_meditags=False):
    fake = Faker()
    logging.info("Inserting random data into the database...")
    combined_results = []

    # Insert data into the 'Patient' table
    if insert_patients:
        insert_patient_query = '''
        INSERT INTO Patient (Name, Phone, Age, Sex)
        VALUES (%s, %s, %s, %s)
        '''
        patient_data = [(fake.name(), fake.phone_number()[:14], randint(1, 100), choice(['M', 'F'])) for i in range(1, 11)]
        logging.debug(f"Patient data: {patient_data}")
        for data in patient_data:
            try:
                result = execute_query(connection, insert_patient_query, data)
                combined_results.append(result)
            except Exception as e:
                combined_results.append({"message": "Query Failed", "query": insert_patient_query.strip().replace('\n', ' ').strip(), "data": data, "error": str(e)})
                logging.error(f"Failed to insert patient data {data}: {e}")

    # Insert data into the 'Bed' table
    if insert_beds:
        insert_bed_query = '''
        INSERT INTO Bed (Type, Location, Status, Pid)
        VALUES (%s, %s, %s, %s)
        '''
        status = [choice(['Available', 'Occupied', 'Reserved']) for _ in range(11)]
        bed_data = [(choice(['General', 'ICU', 'Private']), f"{choice(['A', 'B', 'C'])}/{randint(0, 3)}{randint(10, 99)}", status[i], randint(1, 9) if status[i] == 'Occupied' or status[i]=='Reserved' else None) for i in range(11)]
        logging.debug(f"Bed data: {bed_data}")
        for data in bed_data:
            try:
                result = execute_query(connection, insert_bed_query, data)
                combined_results.append(result)
            except Exception as e:
                combined_results.append({"message": "Query Failed", "query": insert_bed_query.strip().replace('\n', ' ').strip(), "data": data, "error": str(e)})
                logging.error(f"Failed to insert bed data {data}: {e}")

    # Insert data into the 'History' table
    if insert_history:
        insert_history_query = '''
        INSERT INTO History (PID, Doctor, Date, PrescriptionID)
        VALUES (%s, %s, %s, %s)
        '''
        history_data = [(randint(1, 11), fake.name(), fake.date_between(start_date='-1y', end_date='today'), fake.uuid4()[:8]) for _ in range(10)]
        for data in history_data:
            try:
                result = execute_query(connection, insert_history_query, data)
                combined_results.append(result)
            except Exception as e:
                combined_results.append({"message": "Query Failed", "query": insert_history_query.strip().replace('\n', ' ').strip(), "data": data, "error": str(e)})
                logging.error(f"Failed to insert history data {data}: {e}")

    # Insert data into the 'Medicine' table
    if insert_medicines:
        insert_medicine_query = '''
        INSERT INTO Medicine (MediName, Qty,Expiry,Price)
        VALUES (%s, %s, %s, %s)
        '''
        medicine_data = [(generate_medication_name(), randint(1, 100), fake.date_between(start_date='-1y',end_date='today'),max(10,random()*1000)) for _ in range(10)]
        for data in medicine_data:
            try:
                result = execute_query(connection, insert_medicine_query, data)
                combined_results.append(result)
            except Exception as e:
                combined_results.append({"message": "Query Failed", "query": insert_medicine_query.strip().replace('\n', ' ').strip(), "data": data, "error": str(e)})
                logging.error(f"Failed to insert medicine data {data}: {e}")

    # Insert data into the 'Meditag' table
    if insert_meditags:
        insert_meditag_query = '''
        INSERT INTO Meditag (MediID, MediTag)
        VALUES (%s, %s)
        '''
        meditag_data = [(i, choice(['Painkiller', 'Antibiotic', 'Supplement', 'Antiseptic'])) for i in range(1, 51)]
        for data in meditag_data:
            try:
                result = execute_query(connection, insert_meditag_query, data)
                combined_results.append(result)
            except Exception as e:
                combined_results.append({"message": "Query Failed", "query": insert_meditag_query.strip().replace('\n', ' ').strip(), "data": data, "error": str(e)})
                logging.error(f"Failed to insert meditag data {data}: {e}")

    return combined_results

def generate_medication_name():
    base_names = ["Aero", "Cura", "Helio", "Nova", "Vita", "Zeno", "Riva", "Lumen", "Medi", "Nex"]
    modifiers = ["Clear", "Max", "Prime", "Sure", "Ultra", "Gen", "Flex", "Opti", "Plus", "Pure"]
    suffixes = ["-in", "-ol", "-ex", "-am", "-an", "-ium", "-or", "-ide", "-ine", "-ar"]
    return f"{choice(base_names)}{choice(modifiers)}{choice(suffixes)}"

def retrieve_connection(
    host_name=getenv('MYSQL_HOST','127.0.0.1'),  # Use 'mysql' as hostname within Docker network
    user_name=getenv('MYSQL_USER','root'),
    user_password=getenv('MYSQL_PASSWORD','password'),
    db_name=getenv('MYSQL_DATABASE','hospital_db')
):
    connection = create_connection(host_name, user_name, user_password, db_name)
    if connection.is_connected():
        return connection
    else:
        raise mysql.connector.Error("Connection to MySQL DB failed")

if __name__ == '__main__':

    connection = retrieve_connection()
    
    # Create Database
    create_database_query = "CREATE DATABASE IF NOT EXISTS hospital_db"
    execute_query(connection, create_database_query)
    
    # Create Tables
    create_bed_table = """
    CREATE TABLE IF NOT EXISTS Bed (
        BedID INT AUTO_INCREMENT PRIMARY KEY,
        Type VARCHAR(50),
        Location VARCHAR(100),
        Status VARCHAR(50),
        Pid INT
    );
    """
    create_medicine_table = """
    CREATE TABLE IF NOT EXISTS Medicine (
        MediID INT AUTO_INCREMENT PRIMARY KEY,
        MediName VARCHAR(100),
        Price INT,
        Qty INT,
        Expiry DATE
    );
    """
    create_meditag_table = '''
    CREATE TABLE IF NOT EXISTS Meditag (
        MediID INT,
        MediTag VARCHAR(50),
        FOREIGN KEY (MediID) REFERENCES Medicine(MediID),
        PRIMARY KEY (MediID, MediTag)
    );
    '''
    create_patient_table = """
    CREATE TABLE IF NOT EXISTS Patient (
        PatientID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100),
        Phone VARCHAR(15),
        Age INT,
        Sex CHAR(1)
    );
    """
    create_history_table = """
    CREATE TABLE IF NOT EXISTS History (
        PID INT,
        Doctor VARCHAR(100),
        Date DATE,
        PrescriptionID VARCHAR(50),
        FOREIGN KEY (PID) REFERENCES Patient(PatientID),
        PRIMARY KEY (PID, Date, PrescriptionID)
    );
    """
    
    for query in [create_bed_table, create_medicine_table, create_patient_table, create_history_table, create_meditag_table]:
        execute_query(connection, query)
    
    connection.close()
