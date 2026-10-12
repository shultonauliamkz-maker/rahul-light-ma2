/**
 * grandMA2 Sample File Factory
 * Generates genuine MA2 test files for immediate testing and verification
 * Maintained by RAHUL LIGHT Engineering Team
 */

import zlib from 'zlib';
import AdmZip from 'adm-zip';

export function getSampleFiles() {
  // 1. grandMA2 v3.9.63.6 Macro XML
  const macroXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.63/MA.xsd" major_vers="3" minor_vers="9" stream_vers="63" stream_sub_vers="6">
    <Info datetime="2024-03-20T19:45:00" showfile="Festival Tour 2024" />
    <Macro index="10" name="RL_Color_Bump_3.9.63">
        <Macroline index="0">
            <text>ClearAll</text>
            <info>Safety clear command line</info>
        </Macroline>
        <Macroline index="1">
            <text>Group 1 At 100</text>
        </Macroline>
        <Macroline index="2">
            <text>Appearance Macro 10 /color="#00D2FF"</text>
            <info>Electric Cyan Accent (Requires v3.8+ or RGB rewrite for v3.9.60)</info>
        </Macroline>
        <Macroline index="3">
            <text>Appearance Executor 1.101 /color="#FF0055"</text>
            <info>Neon Magenta Tag</info>
        </Macroline>
        <Macroline index="4">
            <text>NetworkSpeed Eth0 1000</text>
            <info>Art-Net 4 Gigabit Sync mode command</info>
        </Macroline>
        <Macroline index="5">
            <text>Go Executor 1.101</text>
        </Macroline>
    </Macro>
</MA>`;

  // 2. grandMA2 v3.9.63.6 Lua Plugin
  const luaPlugin = `--------------------------------------------------------------------------------
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
`;

  // 3. grandMA2 v3.9.63.6 Showfile XML stream
  const showfileXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.63/MA.xsd" major_vers="3" minor_vers="9" stream_vers="63" stream_sub_vers="6">
    <Info datetime="2024-03-22T21:00:00" showfile="MainStage_RahulLight_v3.9.63" />
    <ShowData>
        <Setup>
            <Patch>
                <Fixture index="1" fid="101" name="Spot Profile 01" gamut="Rec2020" cmy_calibrated="true">
                    <Dmxlane universe="1" address="1" />
                </Fixture>
                <Fixture index="2" fid="102" name="Spot Profile 02" gamut="Rec2020" cmy_calibrated="true">
                    <Dmxlane universe="1" address="35" />
                </Fixture>
            </Patch>
        </Setup>
        <Sequences>
            <Sequence index="1" name="Main Cue Sequence">
                <Cue index="1" name="Opening Hit" trigger="Go" fade="2.0" />
                <Cue index="2" name="Bass Drop Beat" trigger="SoundSync" audio_analysis_band="LowSub" fade="0.0" />
                <Cue index="3" name="Chorus Wash" trigger="Follow" fade="3.5" />
            </Sequence>
        </Sequences>
        <Executors>
            <Executor index="1" name="Main Rig Fader" fader="Master" sequence="1" />
        </Executors>
    </ShowData>
</MA>`;

  // Gzip compressed showfile buffer
  const showfileGzip = zlib.gzipSync(Buffer.from(showfileXml, 'utf-8'), { level: 9 });

  // 4. Sample Effect XML
  const effectXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.63/MA.xsd" major_vers="3" minor_vers="9" stream_vers="63" stream_sub_vers="6">
    <Info datetime="2024-03-18T14:10:00" showfile="FX Library 2024" />
    <Effect index="1" name="Sine Dimmer Wave">
        <Form index="0" name="Sine">
            <Point x="0" y="0" />
            <Point x="0.5" y="1" />
            <Point x="1" y="0" />
        </Form>
        <PhaserPreview mode="Continuous" step_count="2" />
    </Effect>
</MA>`;

  // 5. grandMA2 v3.9.61 Fixture Library XML
  const fixtureXml = `<?xml version="1.0" encoding="utf-8"?>
<MA xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.malighting.de/grandma2/xml/MA" xsi:schemaLocation="http://schemas.malighting.de/grandma2/xml/MA http://schemas.malighting.de/grandma2/xml/3.9.61/MA.xsd" major_vers="3" minor_vers="9" stream_vers="61">
	<Info datetime="2026-06-12T21:50:31" showfile="Festival Rig 2026" />
	<FixtureType index="1" name="PIXSEL 11 CH" mode="11 CH">
		<short_name>PIXSEL 11 CH</short_name>
		<manufacturer>ALFACOM</manufacturer>
		<short_manufacturer>PIXSEL 11 CH</short_manufacturer>
		<Modules index="0">
			<Module index="0" class="None" beamtype="Wash" beam_angle="35" beam_intensity="10000">
				<ChannelType index="0" attribute="DIM" feature="DIMMER" preset="DIMMER" coarse="1" highlight_value="100">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="1" subattribute="DIM" attribute="DIM" feature="DIMMER" preset="DIMMER" />
				</ChannelType>
				<ChannelType index="1" attribute="SHUTTER" feature="SHUTTER" preset="BEAM" coarse="2">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="1" subattribute="SHUTTER" attribute="SHUTTER" feature="SHUTTER" preset="BEAM" />
				</ChannelType>
				<ChannelType index="2" attribute="VIRTUAL_COLOR_MODE" feature="COLORHSB" preset="COLOR" coarse="3">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" subattribute="VIRTUAL_COLOR_MODE" attribute="VIRTUAL_COLOR_MODE" feature="COLORHSB" preset="COLOR" />
				</ChannelType>
				<ChannelType index="3" attribute="CRIMODE" feature="CTC" preset="COLOR" coarse="4">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" subattribute="CRIMODESELECT" attribute="CRIMODE" feature="CTC" preset="COLOR" />
				</ChannelType>
				<ChannelType index="4" attribute="COLOR1" feature="COLOR1" preset="COLOR" coarse="5">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" subattribute="COLOR1WHEELRANDOM" attribute="COLOR1" feature="COLOR1" preset="COLOR" />
				</ChannelType>
				<ChannelType index="5" attribute="STROBEMODE" feature="SHUTTER" preset="BEAM" coarse="6">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" subattribute="STROBEMODE" attribute="STROBEMODE" feature="SHUTTER" preset="BEAM" />
				</ChannelType>
				<ChannelType index="6" attribute="COLORHSB1" feature="COLORHSB" preset="COLOR" coarse="7">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="360" subattribute="COLORHSB1" attribute="COLORHSB1" feature="COLORHSB" preset="COLOR" />
				</ChannelType>
				<ChannelType index="7" attribute="COLORRGB1" feature="COLORRGB" preset="COLOR" coarse="8" color="ff0000">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="1" subattribute="COLORRGB1" attribute="COLORRGB1" feature="COLORRGB" preset="COLOR" />
				</ChannelType>
				<ChannelType index="8" attribute="COLORRGB2" feature="COLORRGB" preset="COLOR" coarse="9" default="254.999" color="00ff00">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="1" subattribute="COLORRGB2" attribute="COLORRGB2" feature="COLORRGB" preset="COLOR" />
				</ChannelType>
				<ChannelType index="9" attribute="COLORRGB3" feature="COLORRGB" preset="COLOR" coarse="10" default="254.999" color="0000ff">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="1" subattribute="COLORRGB3" attribute="COLORRGB3" feature="COLORRGB" preset="COLOR" />
				</ChannelType>
				<ChannelType index="10" attribute="COLORRGB5" feature="COLORRGB" preset="COLOR" coarse="11" default="254.999" color="ffffff">
					<ChannelFunction index="0" from="0" to="100" min_dmx_24="0" max_dmx_24="16777215" physfrom="0" physto="1" subattribute="COLORRGB5" attribute="COLORRGB5" feature="COLORRGB" preset="COLOR" />
				</ChannelType>
			</Module>
		</Modules>
		<Instances index="1">
			<Instance index="0" module_index="0" />
		</Instances>
		<Wheels index="2" />
		<VirtualFunctionBlocks index="3" />
		<FixtureMacroCollect index="5" />
		<Body />
		<AutoPresets index="4" />
		<RdmNotifications index="6">
			<RdmNotification index="0" Type="Absent" Subcategory="RDM Warning" />
		</RdmNotifications>
	</FixtureType>
</MA>`;

  // 6. ZIP package containing all above
  const zip = new AdmZip();
  zip.addFile('library/alfacom@pixsel_11_ch@11_ch.xml', Buffer.from(fixtureXml, 'utf-8'));
  zip.addFile('macros/RL_Color_Bump_3.9.63.xml', Buffer.from(macroXml, 'utf-8'));
  zip.addFile('plugins/RL_Auto_Rigger.lua', Buffer.from(luaPlugin, 'utf-8'));
  zip.addFile('effects/Sine_Dimmer_Wave.xml', Buffer.from(effectXml, 'utf-8'));
  zip.addFile('shows/MainStage_RahulLight.show', showfileGzip);

  const zipBuffer = zip.toBuffer();

  return {
    'sample-fixture': {
      fileName: 'alfacom@pixsel_11_ch@11_ch.xml',
      fileType: 'fixture_xml',
      version: '3.9.61.0',
      buffer: Buffer.from(fixtureXml, 'utf-8'),
      description: 'grandMA2 Fixture Library XML (ALFACOM PIXSEL 11 CH Wash dengan atribut modern v3.9)'
    },
    'sample-effect': {
      fileName: 'Sine_Dimmer_Wave_v3.9.63.xml',
      fileType: 'effect_xml',
      version: '3.9.63.6',
      buffer: Buffer.from(effectXml, 'utf-8'),
      description: 'grandMA2 Effect XML (Bentuk gelombang sinus dengan pratinjau Phaser v3.9)'
    },
    'sample-macro': {
      fileName: 'RL_Color_Bump_v3.9.63.xml',
      fileType: 'macro_xml',
      version: '3.9.63.6',
      buffer: Buffer.from(macroXml, 'utf-8'),
      description: 'grandMA2 Macro XML (Sintaks baris perintah dengan kode warna Hex v3.9.63)'
    },
    'sample-plugin': {
      fileName: 'RL_Auto_Rigger_v3.9.63.lua',
      fileType: 'lua_plugin',
      version: '3.9.63.6',
      buffer: Buffer.from(luaPlugin, 'utf-8'),
      description: 'grandMA2 Lua Plugin (API gma.gui.progress & gma.network v3.9.63)'
    },
    'sample-show': {
      fileName: 'MainStage_RahulLight_v3.9.63.show',
      fileType: 'showfile',
      version: '3.9.63.6',
      buffer: showfileGzip,
      description: 'grandMA2 Showfile Gzip kompresi asli (SoundSync & kalibrasi gamut Rec2020)'
    },
    'sample-zip': {
      fileName: 'RahulLight_TourBundle_v3.9.63.zip',
      fileType: 'zip_package',
      version: '3.9.63.6',
      buffer: zipBuffer,
      description: 'Paket Tur ZIP Lengkap (Showfile, Library Fixture, Effect, Macro, Plugin)'
    }
  };
}
