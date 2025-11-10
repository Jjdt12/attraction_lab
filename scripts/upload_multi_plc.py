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

def compile_and_start_program(plc):
    """Compile program and add to database"""
    print(f"⚙️  Compiling program for {plc['name']}...")

    compile_cmd = (
        f"docker exec {plc['container']} /bin/bash -c '"
        f"cd {WEBSERVER_DIR} && "
        f"python3 compile_program.py st_files/{plc['st_file']} && "
        f"./scripts/compile_program.sh st_files/{plc['st_file']}'"
    )

    success, stdout, stderr = run_docker_command(compile_cmd, check=False)

    if not success or "error" in stderr.lower():
        print(f"✗ Compilation failed for {plc['name']}")
        if stderr:
            print(f"Stderr: {stderr}")
        if stdout:
            print(f"Stdout: {stdout}")
        return False

    print(f"✓ Program compiled successfully for {plc['name']}")
    return True

def setup_plc(plc):
    """Setup a single PLC"""
    print(f"\n{'='*60}")
    print(f"Setting up PLC: {plc['name']}")
    print(f"{'='*60}")

    if not wait_for_container(plc['container']):
        return False

    time.sleep(2)

    if not verify_program_exists(plc):
        return False

    if not copy_st_file_to_webserver(plc):
        return False

    if not compile_and_start_program(plc):
        return False

    print(f"\n✓ {plc['name']} PLC initialized successfully!")
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
        print("✓ All PLCs initialized successfully!")
        print("\nPLC Web Interfaces:")
        for plc in PLCS:
            print(f"  • {plc['name']:8s} - http://localhost:{plc['port']} (openplc/openplc)")
        print("\nModbus TCP Ports:")
        print("  • MAIN:    localhost:502")
        print("  • SAFETY:  localhost:503")
        print("  • EFFECTS: localhost:504")
        return 0
    else:
        print("⚠️  Some PLCs failed to initialize")
        print("The system may still work in degraded mode")
        return 1

if __name__ == "__main__":
    sys.exit(main())
