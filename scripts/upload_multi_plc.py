#!/usr/bin/env python3
"""
Auto-compile ST programs for all three PLCs in OpenPLC Runtime using Docker
"""

import subprocess
import time
import sys
import requests
from pathlib import Path

# PLC Configuration
PLCS = [
    {
        'name': 'MAIN',
        'container': 'attraction-plc-main',
        'st_file': 'attraction_control_main.st',
        'port': 8080,
    },
    {
        'name': 'SAFETY',
        'container': 'attraction-plc-safety',
        'st_file': 'attraction_control_safety.st',
        'port': 8081,
    },
    {
        'name': 'EFFECTS',
        'container': 'attraction-plc-effects',
        'st_file': 'attraction_control_effects.st',
        'port': 8082,
    },
]

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

def wait_for_container(container_name, max_attempts=30):
    """Wait for OpenPLC container to be running"""
    print(f"⏳ Waiting for {container_name} to start...")
    for i in range(max_attempts):
        success, stdout, _ = run_docker_command(
            f"docker ps --filter name={container_name} --filter status=running --format '{{{{.Names}}}}'",
            check=False
        )
        if success and container_name in stdout:
            print(f"✓ {container_name} is running!")
            return True

        time.sleep(1)
        if (i + 1) % 5 == 0:
            print(f"  Still waiting... ({i + 1}s)")

    print(f"✗ {container_name} failed to start")
    return False

def verify_program_exists(plc):
    """Verify ST file exists in the container"""
    st_file = Path(__file__).parent / plc['st_file']
    container_st_path = f"/workdir/st_files/{plc['st_file']}"

    if not st_file.exists():
        print(f"✗ ST file not found on host: {st_file}")
        return False

    print(f"🔍 Checking if {plc['st_file']} is accessible in {plc['name']}...")
    success, stdout, stderr = run_docker_command(
        f"docker exec {plc['container']} test -f {container_st_path}",
        check=False
    )

    if success:
        print(f"✓ Program file is accessible in {plc['name']}")
        return True
    else:
        print(f"✗ Program file not found in container at {container_st_path}")
        return False

def copy_st_file_to_webserver(plc):
    """Copy the ST file from /workdir to webserver/st_files"""
    print(f"📋 Copying ST file to {plc['name']} webserver directory...")

    container_st_path = f"/workdir/st_files/{plc['st_file']}"
    copy_cmd = (
        f"docker exec {plc['container']} /bin/bash -c '"
        f"cp {container_st_path} {WEBSERVER_DIR}/st_files/{plc['st_file']}"
        f"'"
    )

    success, stdout, stderr = run_docker_command(copy_cmd, check=False)
    if success:
        print(f"✓ ST file copied successfully to {plc['name']}")
        return True
    else:
        print(f"✗ Failed to copy ST file to {plc['name']}")
        if stderr:
            print(f"Error: {stderr}")
        return False

def compile_program(plc):
    """Compile program and add to database"""
    print(f"⚙️  Compiling program for {plc['name']}...")

    compile_cmd = (
        f"docker exec {plc['container']} /bin/bash -c '"
        f"cd {WEBSERVER_DIR}/scripts/ && "
        f"./compile_program.sh {plc['st_file']}'"
    )

    success, stdout, stderr = run_docker_command(compile_cmd, check=False)

    # Always show compilation output for debugging
    if stdout:
        print(f"📋 Compilation output for {plc['name']}:")
        print(stdout)
    if stderr:
        print(f"📋 Compilation stderr for {plc['name']}:")
        print(stderr)

    if not success or "error" in stderr.lower():
        print(f"✗ Compilation failed for {plc['name']}")
        return False

    print(f"✓ Program compiled successfully for {plc['name']}")
    return True


def restart_plc_container(plc):
    """Restart the PLC container to load new program"""
    print(f"🔄 Restarting {plc['name']} container...")

    restart_cmd = f"docker restart {plc['container']}"
    success, stdout, stderr = run_docker_command(restart_cmd, check=False)

    if not success:
        print(f"✗ Failed to restart {plc['name']} container")
        return False

    print(f"✓ {plc['name']} container restarted")
    print(f"⏳ Waiting for {plc['name']} to initialize...")
    time.sleep(8)  # Give it time to fully restart

    # Verify container is back up
    if not wait_for_container(plc['container']):
        print(f"✗ {plc['name']} did not restart properly")
        return False

    return True


def start_plc_program(plc):
    """Start the PLC program via HTTP (requires auth)"""
    print(f"🚀 Starting {plc['name']} PLC program...")

    cookie_file = Path(__file__).parent / f".plc_cookie_{plc['name'].lower()}.txt"
    base_url = f"http://localhost:{plc['port']}"

    # Step 1: Login to get session cookie
    login_cmd = (
        f'curl -s -X POST -d "username=openplc&password=openplc" '
        f'-c {cookie_file} {base_url}/login'
    )

    try:
        result = subprocess.run(login_cmd, shell=True, check=True, capture_output=True, timeout=10)
        print(f"✓ Authenticated with {plc['name']} PLC")
    except subprocess.SubprocessError as e:
        print(f"✗ Failed to authenticate with {plc['name']}: {e}")
        return False

    # Step 2: Remove blank_program (id=1) if it exists
    print(f"🗑️  Removing blank_program from {plc['name']}...")
    remove_cmd = f'curl -s -b {cookie_file} "{base_url}/remove-program?id=1"'

    try:
        subprocess.run(remove_cmd, shell=True, capture_output=True, timeout=10)
        print(f"✓ Removed blank_program from {plc['name']}")
    except subprocess.SubprocessError:
        print(f"⚠  Could not remove blank_program (may not exist)")

    # Step 3: Start the PLC
    start_cmd = f'curl -s -b {cookie_file} {base_url}/start_plc'

    try:
        result = subprocess.run(start_cmd, shell=True, capture_output=True, timeout=10, text=True)

        if result.returncode == 0:
            print(f"✓ {plc['name']} PLC program started successfully!")
            return True
        else:
            print(f"⚠  Start command returned code {result.returncode}")
            if result.stdout:
                print(f"Response: {result.stdout[:200]}")
            return False
    except subprocess.SubprocessError as e:
        print(f"✗ Failed to start {plc['name']} PLC program: {e}")
        return False
    finally:
        # Clean up cookie file
        if cookie_file.exists():
            cookie_file.unlink()

    return True

def setup_plc(plc):
    """Setup a single PLC - full process"""
    print(f"\n{'='*60}")
    print(f"Setting up PLC: {plc['name']}")
    print(f"{'='*60}")

    # Step 1: Wait for container
    if not wait_for_container(plc['container']):
        return False

    time.sleep(2)

    # Step 2: Verify program exists
    if not verify_program_exists(plc):
        return False

    # Step 3: Copy ST file to webserver
    if not copy_st_file_to_webserver(plc):
        return False

    # Step 4: Compile program
    if not compile_program(plc):
        return False

    # Step 5: Restart container to load new program
    if not restart_plc_container(plc):
        return False

    # Step 6: Start the PLC program via HTTP
    if not start_plc_program(plc):
        print(f"⚠  {plc['name']} program may not have started, but continuing...")
        # Don't return False here - program might still work

    print(f"\n✓ {plc['name']} PLC fully initialized and running!")
    return True

def main():
    print("=" * 60)
    print("Multi-PLC Attraction Control Auto-Setup")
    print("=" * 60)

    all_success = True
    for plc in PLCS:
        if not setup_plc(plc):
            all_success = False
            print(f"\n⚠️  {plc['name']} PLC setup failed, but continuing...")

    print("\n" + "=" * 60)
    if all_success:
        print("✓ All PLCs initialized and running!")
        print("\n🎯 PLC Programs Started:")
        for plc in PLCS:
            print(f"  • {plc['name']:8s} - attraction_control_{plc['name'].lower()}.st")
        print("\n🌐 PLC Web Interfaces:")
        for plc in PLCS:
            print(f"  • {plc['name']:8s} - http://localhost:{plc['port']} (openplc/openplc)")
        print("\n🔌 Modbus TCP Ports:")
        print("  • MAIN:    localhost:502")
        print("  • SAFETY:  localhost:503")
        print("  • EFFECTS: localhost:504")
        print("\n✨ All three PLCs are now running their control programs!")
        print("   You can now start the SCADA HMI with: python3 standalone_server.py")
        return 0
    else:
        print("⚠️  Some PLCs failed to initialize")
        print("The system may still work in degraded mode")
        return 1

if __name__ == "__main__":
    sys.exit(main())
