#!/usr/bin/env python3
"""
Auto-compile ST program in OpenPLC Runtime using Docker
Uses direct docker commands to copy and compile the program reliably
"""

import subprocess
import time
import sys
import requests
from pathlib import Path

# Configuration
ST_FILE = Path(__file__).parent / "attraction_control.st"
ST_FILENAME = "attraction_control.st"
CONTAINER_NAME = "attraction-openplc"
# The ST file is already mounted at this path via docker-compose volumes
CONTAINER_ST_PATH = "/workdir/st_files/attraction_control.st"
# OpenPLC webserver directory where compilation happens
WEBSERVER_DIR = "/root/OpenPLC_v3/webserver"

def run_docker_command(cmd, check=True):
    """Run a docker command and return the result"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        if check and result.returncode != 0:
            return False, result.stdout, result.stderr
        return True, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", "Command timed out"
    except Exception as e:
        return False, "", str(e)

def wait_for_container(max_attempts=30):
    """Wait for OpenPLC container to be running"""
    print("⏳ Waiting for OpenPLC container to start...")
    for i in range(max_attempts):
        success, stdout, _ = run_docker_command(
            f"docker ps --filter name={CONTAINER_NAME} --filter status=running --format '{{{{.Names}}}}'",
            check=False
        )
        if success and CONTAINER_NAME in stdout:
            print("✓ Container is running!")
            return True

        time.sleep(1)
        if (i + 1) % 5 == 0:
            print(f"  Still waiting... ({i + 1}s)")

    print("✗ Container failed to start")
    return False

def verify_program_exists():
    """Verify ST file exists in the container (mounted via docker-compose)"""
    if not ST_FILE.exists():
        print(f"✗ ST file not found on host: {ST_FILE}")
        return False

    print(f"🔍 Checking if {ST_FILE.name} is accessible in container...")
    success, stdout, stderr = run_docker_command(
        f"docker exec {CONTAINER_NAME} test -f {CONTAINER_ST_PATH}",
        check=False
    )

    if success:
        print("✓ Program file is accessible in container")
        return True
    else:
        print(f"✗ Program file not found in container at {CONTAINER_ST_PATH}")
        print(f"  Make sure docker-compose volumes are mounted correctly")
        return False

def copy_st_file_to_webserver():
    """Copy the ST file from /workdir to webserver/st_files"""
    print("📋 Copying ST file to webserver directory...")

    copy_cmd = (
        f"docker exec {CONTAINER_NAME} /bin/bash -c '"
        f"cp {CONTAINER_ST_PATH} {WEBSERVER_DIR}/st_files/{ST_FILENAME}"
        f"'"
    )

    success, stdout, stderr = run_docker_command(copy_cmd, check=False)
    if success:
        print("✓ ST file copied successfully")
        return True
    else:
        print("✗ Failed to copy ST file")
        if stderr:
            print(f"Error: {stderr}")
        return False

def compile_and_start_program():
    """Compile program and add to database in one operation"""
    print("🔧 Compiling program and adding to database...")

    # This replicates what the web interface does:
    # 1. cd to scripts directory
    # 2. compile with just the filename (compile script looks in ../st_files/)
    # 3. insert database record with Unix timestamp
    # Note: Table is "Programs" (capital P), Date_upload is INTEGER (Unix timestamp)
    compile_cmd = (
        f"docker exec {CONTAINER_NAME} /bin/bash -c '"
        f"cd {WEBSERVER_DIR}/scripts/ && "
        f"./compile_program.sh {ST_FILENAME} && "
        f"TIMESTAMP=$(date +%s) && "
        f"sqlite3 {WEBSERVER_DIR}/openplc.db \"INSERT OR REPLACE INTO Programs (Name, File, Description, Date_upload) "
        f"VALUES (\\\"attraction_control\\\", \\\"{ST_FILENAME}\\\", \\\"Attraction ride control system\\\", $TIMESTAMP);\" "
        f"'"
    )

    success, stdout, stderr = run_docker_command(compile_cmd, check=False)

    # Show compilation output
    if stdout:
        print("\n--- Compilation Output ---")
        print(stdout)
        print("--- End Output ---\n")

    if stderr:
        print("\n--- Error Output ---")
        print(stderr)
        print("--- End Errors ---\n")

    # Check for successful compilation message
    if "Compilation finished successfully!" in stdout:
        print("✓ Program compiled successfully!")
        return True

    elif "Compilation finished with errors!" in stdout:
        print("✗ Compilation failed with errors")
        return False
    else:
        print("⚠ Compilation status unclear")
        return False

def verify_program_running():
    """Check if the PLC webserver is responding"""
    print("🔍 Verifying PLC status...")

    # Check if the webserver port is accessible
    success, stdout, stderr = run_docker_command(
        f"docker exec {CONTAINER_NAME} curl -f http://localhost:8080/login",
        check=False
    )

    if success or "login" in stdout.lower():
        print("✓ PLC webserver is responding")
        return True
    else:
        print("⚠ PLC webserver status unclear")
        return False

def main():
    """Main setup flow using Docker"""
    print("=" * 60)
    print("OpenPLC Attraction Control Auto-Setup (Docker Method)")
    print("=" * 60)

    # Wait for container to be running
    if not wait_for_container():
        sys.exit(1)

    # Give the container a moment to fully initialize
    print("⏳ Waiting for services to initialize...")
    time.sleep(3)

    # Verify program exists in container (mounted via docker-compose)
    if not verify_program_exists():
        sys.exit(1)

    # Copy ST file to webserver directory
    if not copy_st_file_to_webserver():
        sys.exit(1)

    # Compile program and add to database (prevents startup crashes)
    if not compile_and_start_program():
        print("\n⚠ Compilation or database update failed. Check the output above.")
        sys.exit(1)

    # Restart the container to load the new program
    print("🔄 Restarting OpenPLC container...")
    restart_success, _, _ = run_docker_command(f"docker restart {CONTAINER_NAME}", check=False)
    if restart_success:
        print("✓ Container restarted")
        # Wait for container to be fully up
        print("⏳ Waiting for container to restart...")
        time.sleep(5)
    else:
        print("⚠ Container restart may have failed")
        sys.exit(1)

    # NOW start the PLC program after the restart
    print("🚀 Starting PLC program...")

    # Login first to get session cookie
    cookie_file = Path(__file__).parent / ".plc_cookie.txt"
    login_cmd = (
        f'curl -s -X POST -d "username=openplc&password=openplc" '
        f'-c {cookie_file} http://localhost:8080/login'
    )

    try:
        subprocess.run(login_cmd, shell=True, check=True, capture_output=True, timeout=10)
        print("✓ Authenticated with OpenPLC")
    except subprocess.SubprocessError as e:
        print(f"✗ Failed to authenticate: {e}")
        sys.exit(1)

    # Remove the blank_program (id=1) before starting our program
    print("🗑️  Removing blank_program...")
    remove_cmd = f'curl -s -b {cookie_file} "http://localhost:8080/remove-program?id=1"'

    try:
        subprocess.run(remove_cmd, shell=True, capture_output=True, timeout=10, text=True)
        print("✓ Removed blank_program")
    except subprocess.SubprocessError as e:
        print(f"⚠ Failed to remove blank_program: {e}")

    # Now start the PLC with the session cookie
    start_cmd = f'curl -s -b {cookie_file} http://localhost:8080/start_plc'

    try:
        result = subprocess.run(start_cmd, shell=True, capture_output=True, timeout=10, text=True)

        # Show the response
        if result.stdout:
            print(f"Start PLC response: {result.stdout}")
        if result.stderr:
            print(f"Start PLC errors: {result.stderr}")

        if result.returncode == 0:
            print("✓ PLC program started successfully!")
        else:
            print(f"⚠ Start command returned code {result.returncode}")
    except subprocess.SubprocessError as e:
        print(f"✗ Failed to start PLC program: {e}")

    # Wait for it to come back up
    time.sleep(5)
    if not wait_for_container():
        print("⚠ Container did not restart properly")
        sys.exit(1)

    # Verify it's running
    verify_program_running()

    print("=" * 60)
    print("✓ Setup Complete!")
    print("  OpenPLC WebUI: http://localhost:8080")
    print("  Modbus TCP:    localhost:502")
    print("  Credentials:   openplc / openplc")
    print("=" * 60)

if __name__ == "__main__":
    main()
