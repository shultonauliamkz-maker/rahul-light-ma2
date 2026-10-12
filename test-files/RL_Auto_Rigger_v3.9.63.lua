--------------------------------------------------------------------------------
-- grandMA2 Lua Plugin v3.9.63.6
-- Name: RAHUL_LIGHT_AUTO_RIGGER
-- Author: Rahul Light Engineering
-- Description: Automated Fixture Preset Generator & Network Monitor
--------------------------------------------------------------------------------

local function main()
    gma.feedback("=== Starting Rahul Light Auto-Rigger v3.9.63.6 ===")

    -- Network status check (Introduced in grandMA2 v3.9)
    local hostData = gma.network.gethostdata()
    if hostData then
        gma.feedback("Running on Station IP: " .. tostring(hostData.ip))
        gma.feedback("Station Name: " .. tostring(hostData.station_name))
    else
        gma.feedback("Warning: gma.network.gethostdata returned nil")
    end

    -- User Interactive Progress Dialog (Introduced in grandMA2 v3.8)
    local progressHandle = gma.gui.progress.start("Configuring Fixture Grid...")
    gma.gui.progress.set_range(progressHandle, 1, 10)

    for i = 1, 10 do
        gma.gui.progress.set(progressHandle, i)
        gma.gui.progress.set_text(progressHandle, "Aligning Beam #" .. tostring(i))
        gma.cmd("Fixture " .. tostring(i) .. " At 100")
        gma.sleep(0.05)
    end

    gma.gui.progress.stop(progressHandle)

    -- Confirmation dialog
    local proceed = gma.gui.confirm("Rahul Light", "Grid successfully populated. Store to Preset 1.10?")
    if proceed then
        gma.cmd("Store Preset 1.10 /merge")
        gma.feedback("Preset 1.10 updated successfully.")
    end
end

return main
