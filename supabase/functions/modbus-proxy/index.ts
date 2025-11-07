import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function createModbusWriteCoilRequest(address: number, value: boolean): Uint8Array {
  const buffer = new Uint8Array(12);
  buffer[0] = 0x00;
  buffer[1] = 0x01;
  buffer[2] = 0x00;
  buffer[3] = 0x00;
  buffer[4] = 0x00;
  buffer[5] = 0x06;
  buffer[6] = 0x01;
  buffer[7] = 0x05;
  buffer[8] = (address >> 8) & 0xFF;
  buffer[9] = address & 0xFF;
  buffer[10] = value ? 0xFF : 0x00;
  buffer[11] = 0x00;
  return buffer;
}

function createModbusReadCoilRequest(address: number, count: number = 1): Uint8Array {
  const buffer = new Uint8Array(12);
  buffer[0] = 0x00;
  buffer[1] = 0x01;
  buffer[2] = 0x00;
  buffer[3] = 0x00;
  buffer[4] = 0x00;
  buffer[5] = 0x06;
  buffer[6] = 0x01;
  buffer[7] = 0x01;
  buffer[8] = (address >> 8) & 0xFF;
  buffer[9] = address & 0xFF;
  buffer[10] = (count >> 8) & 0xFF;
  buffer[11] = count & 0xFF;
  return buffer;
}

function parseModbusResponse(data: Uint8Array, isReadCoil: boolean): any {
  if (data.length < 9) {
    throw new Error('Invalid Modbus response length');
  }

  const functionCode = data[7];
  
  if (functionCode >= 0x80) {
    const exceptionCode = data[8];
    throw new Error(`Modbus exception: ${exceptionCode}`);
  }

  if (isReadCoil) {
    const byteCount = data[8];
    if (data.length < 9 + byteCount) {
      throw new Error('Invalid read coil response');
    }
    const coilValue = data[9] & 0x01;
    return { value: coilValue === 1 };
  } else {
    return { success: true };
  }
}

async function sendModbusRequest(
  host: string,
  port: number,
  request: Uint8Array,
  isReadCoil: boolean
): Promise<any> {
  let conn;
  try {
    console.log(`[Modbus] Connecting to ${host}:${port}`);
    conn = await Deno.connect({ hostname: host, port, transport: 'tcp' });
    console.log(`[Modbus] Connected, sending request:`, Array.from(request));

    await conn.write(request);
    console.log(`[Modbus] Request sent, waiting for response...`);

    const response = new Uint8Array(256);
    const bytesRead = await conn.read(response);

    if (!bytesRead) {
      throw new Error('No response from PLC');
    }

    const responseData = response.slice(0, bytesRead);
    console.log(`[Modbus] Received ${bytesRead} bytes:`, Array.from(responseData));

    const result = parseModbusResponse(responseData, isReadCoil);
    console.log(`[Modbus] Parsed result:`, result);
    return result;
  } catch (error) {
    console.error(`[Modbus] Error:`, error);
    throw new Error(`Modbus TCP error: ${error.message}`);
  } finally {
    if (conn) {
      try {
        conn.close();
      } catch (e) {
        console.error('[Modbus] Error closing connection:', e);
      }
    }
  }
}

Deno.serve(async (req: Request) => {
  console.log(`[Request] ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith("/write-coil") && req.method === "POST") {
      const { plc_host, plc_port, address, value } = await req.json();

      if (!plc_host || !plc_port) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "PLC host and port required",
            connected: false 
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const request = createModbusWriteCoilRequest(address, value);
      const result = await sendModbusRequest(plc_host, plc_port, request, false);

      return new Response(
        JSON.stringify({
          success: true,
          address,
          value,
          connected: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (path.endsWith("/read-coil") && req.method === "POST") {
      const { plc_host, plc_port, address } = await req.json();

      if (!plc_host || !plc_port) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "PLC host and port required",
            connected: false,
            value: false 
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const request = createModbusReadCoilRequest(address);
      const result = await sendModbusRequest(plc_host, plc_port, request, true);

      return new Response(
        JSON.stringify({
          success: true,
          address,
          value: result.value,
          connected: true,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Modbus TCP Proxy API",
        endpoints: {
          "POST /write-coil": "Write to PLC coil (requires plc_host, plc_port, address, value)",
          "POST /read-coil": "Read from PLC coil (requires plc_host, plc_port, address)",
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(`[Error] ${error.message}`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        connected: false
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
