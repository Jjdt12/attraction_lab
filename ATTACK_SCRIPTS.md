# Attack Scripts - Example Collection

This document contains example Python attack scripts for the Attraction Technology Lab.

## Basic Scripts

### 1. Coil Override Attack (Beginner)

```python
# Coil Override Attack
# Challenge: Write TRUE to coil address 3

print("[*] Starting Coil Override attack...")
print("[*] Target: Coil Address 3")
print("[*] Action: Write TRUE")

# Execute the write (must use await since it's async)
result = await write_coil(3, True)

if result.get('success'):
    print("[SUCCESS] Coil 3 set to TRUE!")
    print("[INFO] Check CTF Challenges panel for completion")
else:
    print(f"[ERROR] Failed: {result.get('error', 'Unknown error')}")
```

### 2. Sequential Coil Write Attack

```python
# Sequential Coil Write Attack
# Demonstrates writing to multiple coils in sequence

print("[*] Sequential Coil Write Attack")
print("[*] Writing to coils 0-5...")

for address in range(6):
    print(f"\n[*] Writing to coil {address}...")
    result = await write_coil(address, True)

    if result.get('success'):
        print(f"    [OK] Coil {address} written successfully")
    else:
        print(f"    [FAIL] Coil {address} failed: {result.get('error')}")

print("\n[*] Attack sequence complete!")
```

### 3. Toggle Attack

```python
# Toggle Attack
# Rapidly toggle a coil between TRUE and FALSE

print("[*] Toggle Attack")
print("[*] Target: Coil 3")
print("[*] Toggling 5 times...")

for i in range(5):
    # Write TRUE
    result1 = await write_coil(3, True)
    print(f"[{i+1}] Set to TRUE: {result1.get('success')}")

    # Write FALSE
    result2 = await write_coil(3, False)
    print(f"[{i+1}] Set to FALSE: {result2.get('success')}")

print("\n[*] Toggle attack complete!")
```

## Advanced Scripts

### 4. Conditional Attack

```python
# Conditional Coil Attack
# Only execute if certain conditions are met

print("[*] Conditional Attack")
print("[*] Attempting to write coil 3...")

# First attempt
result = await write_coil(3, True)

if result.get('success'):
    print("[SUCCESS] Initial write succeeded!")
    print("[*] Attempting follow-up attack on coil 5...")

    result2 = await write_coil(5, True)
    if result2.get('success'):
        print("[SUCCESS] Multi-stage attack complete!")
    else:
        print("[WARNING] Second stage failed")
else:
    print("[ERROR] Initial attack failed, aborting")
```

### 5. Error Handling Example

```python
# Robust Attack with Error Handling
# Demonstrates proper error handling

async def safe_write_coil(addr, val):
    try:
        result = await write_coil(addr, val)
        if result.get('success'):
            return True
        else:
            print(f"[ERROR] Write failed: {result.get('error')}")
            return False
    except Exception as e:
        print(f"[EXCEPTION] Unexpected error: {str(e)}")
        return False

print("[*] Safe Coil Write Attack")
print("[*] Writing with error handling...")

targets = [0, 1, 2, 3, 4, 5]
success_count = 0

for target in targets:
    print(f"\n[*] Targeting coil {target}...")
    if await safe_write_coil(target, True):
        success_count += 1
        print(f"    [OK] Success!")

print(f"\n[REPORT] {success_count}/{len(targets)} writes successful")
```

## API Reference

### Available Functions

#### `write_coil(address, value)`
Writes a boolean value to a specific coil address.

**Parameters:**
- `address` (int): The coil address (0-65535)
- `value` (bool): True or False

**Returns:**
- `dict` with keys:
  - `success` (bool): Whether the operation succeeded
  - `error` (str, optional): Error message if failed

**Example:**
```python
result = await write_coil(3, True)
if result.get('success'):
    print("Write succeeded!")
```

## Security Notes

**Why This is Safe:**

1. **Browser Sandbox**: Python runs entirely in your browser via Pyodide (WebAssembly)
2. **Network Isolation**: Can only communicate via the WebSocket to localhost
3. **No File System Access**: Cannot read/write local files
4. **No System Commands**: Cannot execute shell commands
5. **CORS Protection**: All network requests follow browser security policies

This makes it perfect for learning ICS/SCADA security without any risk to real systems.

## Challenge Tips

### "Coil Override" Challenge
Simply write TRUE to coil address 3:
```python
result = await write_coil(3, True)
```

### Future Challenges
More challenges will be added. Stay tuned!
