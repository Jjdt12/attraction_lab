import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PLCState {
  inputs: {
    proxi_sensor: boolean;
  };
  outputs: {
    flash_light: boolean;
  };
  lastCycle: number;
}

const plcStates = new Map<string, PLCState>();

function getOrCreatePLCState(sessionId: string): PLCState {
  if (!plcStates.has(sessionId)) {
    plcStates.set(sessionId, {
      inputs: {
        proxi_sensor: false,
      },
      outputs: {
        flash_light: false,
      },
      lastCycle: Date.now(),
    });
  }
  return plcStates.get(sessionId)!;
}

function runPLCCycle(state: PLCState): void {
  state.outputs.flash_light = state.inputs.proxi_sensor;
  state.lastCycle = Date.now();
}

Deno.serve(async (req: Request) => {
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
      const { session_id, address, value } = await req.json();

      const state = getOrCreatePLCState(session_id);

      if (address === 0) {
        state.inputs.proxi_sensor = value;
        runPLCCycle(state);

        return new Response(
          JSON.stringify({
            success: true,
            address,
            value,
            output_state: state.outputs,
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
        JSON.stringify({ success: false, error: "Invalid address" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (path.endsWith("/read-coil") && req.method === "POST") {
      const { session_id, address } = await req.json();

      const state = getOrCreatePLCState(session_id);

      if (address === 0) {
        return new Response(
          JSON.stringify({
            success: true,
            address,
            value: state.outputs.flash_light,
            cycle_time: Date.now() - state.lastCycle,
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
        JSON.stringify({ success: false, error: "Invalid address" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (path.endsWith("/state") && req.method === "POST") {
      const { session_id } = await req.json();
      const state = getOrCreatePLCState(session_id);

      return new Response(
        JSON.stringify({
          inputs: state.inputs,
          outputs: state.outputs,
          lastCycle: state.lastCycle,
          uptime: Date.now() - state.lastCycle,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (path.endsWith("/reset") && req.method === "POST") {
      const { session_id } = await req.json();
      plcStates.delete(session_id);

      return new Response(
        JSON.stringify({ success: true, message: "PLC state reset" }),
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
        message: "PLC Simulator API",
        endpoints: {
          "POST /write-coil": "Write to input coil (proxi_sensor at address 0)",
          "POST /read-coil": "Read output coil (flash_light at address 0)",
          "POST /state": "Get complete PLC state",
          "POST /reset": "Reset PLC state",
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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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