/**
 * =========================================================================
 * 🛠️ DAILY MAINTENANCE DASHBOARD - MAIN APP LOGIC
 * =========================================================================
 * * Table of Contents:
 * 1. Global Configuration & Data Maps (ตัวแปรกำหนดโครงสร้าง)
 * 2. Helper & Utility Functions (ฟังก์ชันช่วยเหลือ)
 * 3. Authentication (ระบบล็อคอิน)
 * 4. Navigation & View Management (การเปลี่ยนหน้าจอ)
 * 5. Dashboard & Form Handling (หน้าหลักและการจัดการฟอร์ม)
 * 6. Table & History (ระบบประวัติและแก้ไขข้อมูล)
 * 7. Analytics & Charts (ระบบกราฟสถิติ)
 * 8. Reporting & Export (ระบบออกรายงาน Web / Excel)
 * * =========================================================================
 */

// =========================================================================
// 1. GLOBAL CONFIGURATION & DATA MAPS
// =========================================================================
const API_URL = 'http://127.0.0.1:8000/api/records';

let currentRecords = [];
let currentEditingId = null;
let completedRooms = [];

// แผนผังกำหนดลำดับคอลัมน์และชื่อเต็มตามฟอร์มกรอกข้อมูล
const SYSTEM_COLUMNS = {
  "1.1 MDB": [
    { key: "mdb_a_l1", label: "MDB-A [Lamp Status L1]" }, { key: "mdb_a_l2", label: "MDB-A [Lamp Status L2]" }, { key: "mdb_a_l3", label: "MDB-A [Lamp Status L3]" }, { key: "mdb_a_brk", label: "MDB-A [Breaker]" },
    { key: "mdb_a_v_l1", label: "Main Input Voltage [V] L1" }, { key: "mdb_a_v_l2", label: "Main Input Voltage [V] L2" }, { key: "mdb_a_v_l3", label: "Main Input Voltage [V] L3" },
    { key: "mdb_a_a_l1", label: "Main Input Current [A] L1" }, { key: "mdb_a_a_l2", label: "Main Input Current [A] L2" }, { key: "mdb_a_a_l3", label: "Main Input Current [A] L3" },
    { key: "mdb_a_kw", label: "kW" }, { key: "mdb_a_kvar", label: "kVar" }, { key: "mdb_a_kva", label: "kVa" },
    { key: "mdb_b_l1", label: "MDB-B [Lamp Status L1]" }, { key: "mdb_b_l2", label: "MDB-B [Lamp Status L2]" }, { key: "mdb_b_l3", label: "MDB-B [Lamp Status L3]" }, { key: "mdb_b_brk", label: "MDB-B [Breaker]" },
    { key: "mdb_b_v_l1", label: "Main Input Voltage [V] L1" }, { key: "mdb_b_v_l2", label: "Main Input Voltage [V] L2" }, { key: "mdb_b_v_l3", label: "Main Input Voltage [V] L3" },
    { key: "mdb_b_a_l1", label: "Main Input Current [A] L1" }, { key: "mdb_b_a_l2", label: "Main Input Current [A] L2" }, { key: "mdb_b_a_l3", label: "Main Input Current [A] L3" },
    { key: "mdb_b_kw", label: "kW" }, { key: "mdb_b_kvar", label: "kVar" }, { key: "mdb_b_kva", label: "kVa" }
  ],
  "1.2 PDU": [
    { key: "pdu_1_5a", label: "Data Room-1 [PDU-5A]" }, { key: "pdu_1_5b", label: "Data Room-1 [PDU-5B]" }, { key: "pdu_1_6a", label: "Data Room-1 [PDU-6A]" }, { key: "pdu_1_6b", label: "Data Room-1 [PDU-6B]" },
    { key: "pdu_2_1a", label: "Data Room-2 [PDU-1A]" }, { key: "pdu_2_1b", label: "Data Room-2 [PDU-1B]" }, { key: "pdu_2_2a", label: "Data Room-2 [PDU-2A]" }, { key: "pdu_2_2b", label: "Data Room-2 [PDU-2B]" },
    { key: "pdu_3_3a", label: "Data Room-3 [PDU-3A]" }, { key: "pdu_3_3b", label: "Data Room-3 [PDU-3B]" }, { key: "pdu_4_4a", label: "Data Room-4 [PDU-4A]" }, { key: "pdu_4_4b", label: "Data Room-4 [PDU-4B]" }
  ],
  "1. RMU & TROP": [
    { key: "rmu_a_in1", label: "RMU-A [In L1]" }, { key: "rmu_a_in2", label: "RMU-A [In L2]" }, { key: "rmu_a_in3", label: "RMU-A [In L3]" },
    { key: "rmu_a_out1", label: "RMU-A [Out L1]" }, { key: "rmu_a_out2", label: "RMU-A [Out L2]" }, { key: "rmu_a_out3", label: "RMU-A [Out L3]" },
    { key: "rmu_b_in1", label: "RMU-B [In L1]" }, { key: "rmu_b_in2", label: "RMU-B [In L2]" }, { key: "rmu_b_in3", label: "RMU-B [In L3]" },
    { key: "rmu_b_out1", label: "RMU-B [Out L1]" }, { key: "rmu_b_out2", label: "RMU-B [Out L2]" }, { key: "rmu_b_out3", label: "RMU-B [Out L3]" },
    { key: "trop_a_in1", label: "TROP-A [In L1]" }, { key: "trop_a_in2", label: "TROP-A [In L2]" }, { key: "trop_a_in3", label: "TROP-A [In L3]" },
    { key: "trop_a_out1", label: "TROP-A [Out L1]" }, { key: "trop_a_out2", label: "TROP-A [Out L2]" }, { key: "trop_a_out3", label: "TROP-A [Out L3]" }, { key: "trop_a_brk", label: "TROP-A [Breaker]" },
    { key: "trop_b_in1", label: "TROP-B [In L1]" }, { key: "trop_b_in2", label: "TROP-B [In L2]" }, { key: "trop_b_in3", label: "TROP-B [In L3]" },
    { key: "trop_b_out1", label: "TROP-B [Out L1]" }, { key: "trop_b_out2", label: "TROP-B [Out L2]" }, { key: "trop_b_out3", label: "TROP-B [Out L3]" }, { key: "trop_b_brk", label: "TROP-B [Breaker]" }
  ],
  "2.1 UPS 2000-G": [
    { key: "status1", label: "UPS2000-G #1 [Status]" }, { key: "ups2000_g_battery_1", label: "UPS2000-G #1 Battery (%)" }, { key: "ups2000_g_current_load_l1_1", label: "UPS2000-G #1 Current Load (%) L1" }, { key: "ups2000_g_current_load_l2_1", label: "UPS2000-G #1 Current Load (%) L2" }, { key: "ups2000_g_current_load_l3_1", label: "UPS2000-G #1 Current Load (%) L3" },
    { key: "status2", label: "UPS2000-G #2 [Status]" }, { key: "ups2000_g_battery_2", label: "UPS2000-G #2 Battery (%)" }, { key: "ups2000_g_current_load_l1_2", label: "UPS2000-G #2 Current Load (%) L1" }, { key: "ups2000_g_current_load_l2_2", label: "UPS2000-G #2 Current Load (%) L2" }, { key: "ups2000_g_current_load_l3_2", label: "UPS2000-G #2 Current Load (%) L3" },
    { key: "status3", label: "UPS2000-G #3 [Status]" }, { key: "ups2000_g_battery_3", label: "UPS2000-G #3 Battery (%)" }, { key: "ups2000_g_current_load_l1_3", label: "UPS2000-G #3 Current Load (%) L1" }, { key: "ups200₀_g_current_load_l2_3", label: "UPS200₀_G #3 Current Load (%) L2" }, { key: "ups2₀₀₀_g_current_load_l3_3", label: "UPS2₀₀₀_G #3 Current Load (%) L3" }
  ],
  "2. UPS 5000-E": [
    { key: "power_status1A", label: "UPS5000-E 1-A [Power Status]" }, { key: "ups5000_e_battery_1A", label: "UPS5000-E 1-A Battery (%)" }, { key: "ups5000_e_back_up_time_1A", label: "UPS5000-E 1-A Back-up Time (10>MIN)" }, { key: "ups5000_e_current_load_l1_1A", label: "UPS5000-E 1-A OUTPUT LOAD (<3%) L1" }, { key: "ups5000_e_current_load_l2_1A", label: "UPS5000-E 1-A OUTPUT LOAD (<3%) L2" }, { key: "ups5000_e_current_load_l3_1A", label: "UPS5000-E 1-A OUTPUT LOAD (<3%) L3" },
    { key: "power_status2A", label: "UPS5000-E 2-A [Power Status]" }, { key: "ups5000_e_battery_2A", label: "UPS5000-E 2-A Battery (%)" }, { key: "ups5000_e_back_up_time_2A", label: "UPS5000-E 2-A Back-up Time (10>MIN)" }, { key: "ups5000_e_current_load_l1_2A", label: "UPS5000-E 2-A OUTPUT LOAD (<3%) L1" }, { key: "ups5000_e_current_load_l2_2A", label: "UPS5000-E 2-A OUTPUT LOAD (<3%) L2" }, { key: "ups5000_e_current_load_l3_2A", label: "UPS5000-E 2-A OUTPUT LOAD (<3%) L3" },
    { key: "power_status1-B", label: "UPS5000-E 1-B [Power Status]" }, { key: "ups5000_e_battery_1B", label: "UPS5000-E 1-B Battery (%)" }, { key: "ups5000_e_back_up_time_1B", label: "UPS5000-E 1-B Back-up Time (10>MIN)" }, { key: "ups5000_e_current_load_l1_1B", label: "UPS5000-E 1-B OUTPUT LOAD (<3%) L1" }, { key: "ups5000_e_current_load_l2_1B", label: "UPS5000-E 1-B OUTPUT LOAD (<3%) L2" }, { key: "ups5000_e_current_load_l3_1B", label: "UPS5000-E 1-B OUTPUT LOAD (<3%) L3" },
    { key: "power_status2B", label: "UPS5000-E 2-B [Power Status]" }, { key: "ups5000_e_battery_2B", label: "UPS5000-E 2-B Battery (%)" }, { key: "ups500₀_e_back_up_time_2B", label: "UPS5000-E 2-B Back-up Time (10>MIN)" }, { key: "ups5₀₀₀_e_current_load_l1_2B", label: "UPS5000-E 2-B OUTPUT LOAD (<3%) L1" }, { key: "ups5000_e_current_load_l2_2B", label: "UPS5000-E 2-B OUTPUT LOAD (<3%) L2" }, { key: "ups5000_e_current_load_l3_2B", label: "UPS5000-E 2-B OUTPUT LOAD (<3%) L3" },
    { key: "ups5000_e_remark", label: "Remark" }
  ],
  "3.1 Service Room 1": [
    { key: "sr1_t_11b", label: "Temp 22-26% (CRAC 1-1B)" }, { key: "sr1_h_11b", label: "Humidity 30-60% (CRAC 1-1B)" },
    { key: "sr1_t_12b", label: "Temp 22-26% (CRAC 1-2B)" }, { key: "sr1_h_12b", label: "Humidity 30-60% (CRAC 1-2B)" },
    { key: "sr1_t_13b", label: "Temp 22-26% (CRAC 1-3B)" }, { key: "sr1_h_13b", label: "Humidity 30-60% (CRAC 1-3B)" },
    { key: "sr1_t_14b", label: "Temp 22-26% (CRAC 1-4B)" }, { key: "sr1_h_14b", label: "Humidity 30-60% (CRAC 1-4B)" },
    { key: "sr1_t_15b", label: "Temp 22-26% (CRAC 1-5B)" }, { key: "sr1_h_15b", label: "Humidity 30-60% (CRAC 1-5B)" }
  ],
  "3.2 Service Room 2": [
    { key: "sr2_t_21b", label: "Temp 22-26% (CRAC 2-1B)" }, { key: "sr2_h_21b", label: "Humidity 30-60% (CRAC 2-1B)" },
    { key: "sr2_t_22b", label: "Temp 22-26% (CRAC 2-2B)" }, { key: "sr2_h_22b", label: "Humidity 30-60% (CRAC 2-2B)" },
    { key: "sr2_t_23b", label: "Temp 22-26% (CRAC 2-3B)" }, { key: "sr2_h_23b", label: "Humidity 30-60% (CRAC 2-3B)" },
    { key: "sr2_t_24b", label: "Temp 22-26% (CRAC 2-4B)" }, { key: "sr2_h_24b", label: "Humidity 30-60% (CRAC 2-4B)" },
    { key: "sr2_t_25b", label: "Temp 22-26% (CRAC 2-5B)" }, { key: "sr2_h_25b", label: "Humidity 30-60% (CRAC 2-5B)" },
    { key: "sr2_t_26b", label: "Temp 22-26% (CRAC 2-6B)" }, { key: "sr2_h_26b", label: "Humidity 30-60% (CRAC 2-6B)" }
  ],
  "3.3 Service Room 3": [
    { key: "sr3_t_31b", label: "Temp 22-26% (CRAC 3-1B)" }, { key: "sr3_h_31b", label: "Humidity 30-60% (CRAC 3-1B)" },
    { key: "sr3_t_32b", label: "Temp 22-26% (CRAC 3-2B)" }, { key: "sr3_h_32b", label: "Humidity 30-60% (CRAC 3-2B)" },
    { key: "sr3_t_33b", label: "Temp 22-26% (CRAC 3-3B)" }, { key: "sr3_h_33b", label: "Humidity 30-60% (CRAC 3-3B)" },
    { key: "sr3_t_34b", label: "Temp 22-26% (CRAC 3-4B)" }, { key: "sr3_h_34b", label: "Humidity 30-60% (CRAC 3-4B)" }
  ],
  "3.4 Service Room 4": [
    { key: "sr4_t_41b", label: "Temp 22-26% (CRAC 4-1B)" }, { key: "sr4_h_41b", label: "Humidity 30-60% (CRAC 4-1B)" },
    { key: "sr4_t_42b", label: "Temp 22-26% (CRAC 4-2B)" }, { key: "sr4_h_42b", label: "Humidity 30-60% (CRAC 4-2B)" },
    { key: "sr4_t_43b", label: "Temp 22-26% (CRAC 4-3B)" }, { key: "sr4_h_43b", label: "Humidity 30-60% (CRAC 4-3B)" },
    { key: "sr4_t_44b", label: "Temp 22-26% (CRAC 4-4B)" }, { key: "sr4_h_44b", label: "Humidity 30-60% (CRAC 4-4B)" }
  ],
  "3. UPS & Battery Room": [
    { key: "ups_t_51", label: "Temp 22-26% (CRAC 5-1)" }, { key: "ups_h_51", label: "Humidity 30-60% (CRAC 5-1)" },
    { key: "ups_t_52", label: "Temp 22-26% (CRAC 5-2)" }, { key: "ups_h_52", label: "Humidity 30-60% (CRAC 5-2)" },
    { key: "ups_t_53", label: "Temp 22-26% (CRAC 5-3)" }, { key: "ups_h_53", label: "Humidity 30-60% (CRAC 5-3)" }
  ],
  "Fire Annunciator Panel System": [
    { key: "fire_ann_status", label: "Fire System Annunciator Panel" }, { key: "fire_ann_remark", label: "Remark" }
  ],
  "Fire Suppression System": [
    { key: "fs_facp", label: "Fire Suppression System [FACP]" }, { key: "fs_igcp1", label: "Fire Suppression System [IGCP-1]" }, { key: "fs_igcp2", label: "Fire Suppression System [IGCP-2]" }, { key: "fs_igcp3", label: "Fire Suppression System [IGCP-3]" },
    { key: "fs_nitro1", label: "Pressure of Gas Cylinder [NITRO-1]" }, { key: "fs_nitro2", label: "Pressure of Gas Cylinder [NITRO-2]" }, { key: "fs_srv3", label: "Pressure of Gas Cylinder [Service-3]" }, { key: "fs_srv4", label: "Pressure of Gas Cylinder [Service-4]" },
    { key: "fe_corr1", label: "Non-CFC Fire Extinguisher [Corridor-1]" }, { key: "fe_corr2", label: "Non-CFC Fire Extinguisher [Corridor-2]" }, { key: "fe_corr3", label: "Non-CFC Fire Extinguisher [Corridor-3]" }, { key: "fe_noc1", label: "Non-CFC Fire Extinguisher [NOC-1]" },
    { key: "fe_d11", label: "Non-CFC Fire Extinguisher [DATA1-1]" }, { key: "fe_d12", label: "Non-CFC Fire Extinguisher [DATA1-2]" }, { key: "fe_d21", label: "Non-CFC Fire Extinguisher [DATA2-1]" }, { key: "fe_d22", label: "Non-CFC Fire Extinguisher [DATA2-2]" },
    { key: "fe_d31", label: "Non-CFC Fire Extinguisher [DATA3-1]" }, { key: "fe_d41", label: "Non-CFC Fire Extinguisher [DATA4-1]" }, { key: "fe_lob1", label: "Non-CFC Fire Extinguisher [Lobby-1]" }, { key: "fe_ups1", label: "Non-CFC Fire Extinguisher [UPS & Battery-1]" },
    { key: "fe_ups2", label: "Non-CFC Fire Extinguisher [UPS & Battery-2]" }, { key: "fe_mdb1", label: "Non-CFC Fire Extinguisher [MDB-1]" }, { key: "fe_tr1", label: "Non-CFC Fire Extinguisher [TR & ATS-1]" }, { key: "fe_gen1", label: "Non-CFC Fire Extinguisher [Generator-1]" },
    { key: "fe_fuel", label: "Non-CFC Fire Extinguisher [Fuel]" }
  ],
  "Water Leak Detection System": [
    { key: "water_leak_status", label: "Water Leak Detection System" }
  ],
  "CCTV": [
    { key: "cctv_status", label: "CCTV" }, { key: "cctv_remark", label: "Remark" }
  ],
  "Access Control System": [
    { key: "ac_lobby", label: "[Lobby]" }, { key: "ac_sec", label: "[Security]" }, { key: "ac_mdb", label: "[MDB]" }, { key: "ac_ups", label: "[UPS & Battery]" }, { key: "ac_staging", label: "[Staging]" },
    { key: "ac_service1", label: "[Service-1]" }, { key: "ac_service2", label: "[Service-2]" }, { key: "ac_service3", label: "[Service-3]" }, { key: "ac_service4", label: "[Service-4] " },
    { key: "ac_datacenter1", label: "[Data Center-1]" }, { key: "ac_datacenter2", label: "[Data Center-2]" }, { key: "ac_datacenter3", label: "[Data Center-3]" }, { key: "ac_datacenter4", label: "[Data Center-4]" },
    { key: "ac_noc", label: "[NOC]" }, { key: "ac_mmr", label: "[MMR]" }, { key: "ac_odf", label: "[ODF]" }, { key: "ac_nitro1", label: "[Nitro-1]" }, { key: "ac_nitro2", label: "[Nitro-2]" },
    { key: "ac_emergency_red", label: "[Emergency-Red]" }, { key: "ac_tr", label: "[TR]" }, { key: "ac_synchronize", label: "[Synchronize]" }, { key: "ac_storage", label: "[Storage]" },
    { key: "ac_building_door", label: "[Building Door]" }, { key: "ac_fuel", label: "[Fuel]" }, { key: "ac_corridor", label: "[Corridor]" }, { key: "ac_remark", label: "[Remark]" }
  ],
  "Check Rack Customer": [
    { key: "cr_shift", label: "Work Shift" },
    { key: "cr_dr1_r1", label: "Data Room 1 [Row 1]" }, { key: "cr_dr1_r2", label: "Data Room 1 [Row 2]" }, { key: "cr_dr1_r3", label: "Data Room 1 [Row 3]" }, { key: "cr_dr1_r4", label: "Data Room 1 [Row 4]" }, { key: "cr_dr1_r5", label: "Data Room 1 [Row 5]" }, { key: "cr_dr1_r6", label: "Data Room 1 [Row 6]" }, { key: "cr_dr1_r7", label: "Data Room 1 [Row 7]" },
    { key: "cr_dr2_r1", label: "Data Room 2 [Row 1]" }, { key: "cr_dr2_r2", label: "Data Room 2 [Row 2]" }, { key: "cr_dr2_r3", label: "Data Room 2 [Row 3]" }, { key: "cr_dr2_r4", label: "Data Room 2 [Row 4]" }, { key: "cr_dr2_r5", label: "Data Room 2 [Row 5]" }, { key: "cr_dr2_r6", label: "Data Room 2 [Row 6]" }, { key: "cr_dr2_r7", label: "Data Room 2 [Row 7]" }, { key: "cr_dr2_r8", label: "Data Room 2 [Row 8]" },
    { key: "cr_dr3_r1", label: "Data Room 3 [Row 1]" }, { key: "cr_dr3_r2", label: "Data Room 3 [Row 2]" }, { key: "cr_dr3_r3", label: "Data Room 3 [Row 3]" }, { key: "cr_dr3_r4", label: "Data Room 3 [Row 4]" }, { key: "cr_dr3_r5", label: "Data Room 3 [Row 5]" },
    { key: "cr_dr4_r1", label: "Data Room 4 [Row 1]" }, { key: "cr_dr4_r2", label: "Data Room 4 [Row 2]" }, { key: "cr_dr4_r3", label: "Data Room 4 [Row 3]" }, { key: "cr_dr4_r4", label: "Data Room 4 [Row 4]" },
    { key: "cr_dr1_remark", label: "Remark Data Room 1" }, 
    { key: "cr_dr2_remark", label: "Remark Data Room 2" }, 
    { key: "cr_dr3_remark", label: "Remark Data Room 3" }, 
    { key: "cr_dr4_remark", label: "Remark Data Room 4" }
  ],
  "Generator System": [
    { key: "gen1_auto", label: "Status Auto [Generator-1]" }, { key: "gen2_auto", label: "Status Auto [Generator-2]" }, { key: "gen3_auto", label: "Status Auto [Generator-3]" },
    { key: "gen1_cb", label: "Status CB [Generator-1]" }, { key: "gen2_cb", label: "Status CB [Generator-2]" }, { key: "gen3_cb", label: "Status CB [Generator-3]" },
    { key: "gen1_cool", label: "Status Cooling [Generator-1]" }, { key: "gen2_cool", label: "Status Cooling [Generator-2]" }, { key: "gen3_cool", label: "Status Cooling [Generator-3]" },
    { key: "gen1_fuel", label: "Status Fuel [Generator-1]" }, { key: "gen2_fuel", label: "Status Fuel [Generator-2]" }, { key: "gen3_fuel", label: "Status Fuel [Generator-3]" },
    { key: "gen_tank1", label: "Total of Litre ( Day tank-01 )" }, { key: "gen_tank2", label: "Total of Litre ( Day tank-02 )" }, { key: "gen_tank3", label: "Total of Litre ( Day tank-03 )" }
  ],
  "Fuel System": [
    { key: "fuel_mts_pp1", label: "Fuel [MTS PP-01]" },
    { key: "fuel_mts_pp2", label: "Fuel [MTS PP-02]" },
    { key: "fuel_l_pp1", label: "Lamp Status PP-01 {On,Off}" },
    { key: "fuel_l_pp2", label: "Lamp Status PP-02 {On,Off}" },
    { key: "fuel_ovr1", label: "Control Panel [Pump Overload PP-01]" },
    { key: "fuel_ovr2", label: "Control Panel [Pump Overload PP-02]" },
    { key: "fuel_run1", label: "Control Panel [Pump Run PP-01]" },
    { key: "fuel_run2", label: "Control Panel [Pump Run PP-02]" },
    { key: "fuel_lvl_str1", label: "Fuel System [Storage-01]" },
    { key: "fuel_lvl_str2", label: "Fuel System [Storage-02]" },
    { key: "fuel_lit_str1", label: "Total of Litre ( Storage-01 )" },
    { key: "fuel_lit_str2", label: "Total of Litre ( Storage-02 )" },
    { key: "fuel_solenoid", label: "PP03 control solenoid valve [Storage-01 & 02]" }
  ]
};

// แผนผังกำหนดการจัดกลุ่มหัวตาราง (Top Column Groups)
const SYSTEM_GROUPS = {
  "1. RMU & TROP": [
    { label: "RMU-A", colspan: 6 },
    { label: "RMU-B", colspan: 6 },
    { label: "TROP-A", colspan: 7 },
    { label: "TROP-B", colspan: 7 }
  ],
  "2.1 UPS 2000-G": [
    { label: "UPS2000-G #1", colspan: 5 },
    { label: "UPS2000-G #2", colspan: 5 },
    { label: "UPS2000-G #3", colspan: 5 }
  ],
  "2. UPS 5000-E": [
    { label: "UPS5000-E 1-A", colspan: 6 },
    { label: "UPS5000-E 2-A", colspan: 6 },
    { label: "UPS5000-E 1-B", colspan: 6 },
    { label: "UPS5000-E 2-B", colspan: 6 },
    { label: "Other", colspan: 1 } // สำหรับช่อง Remark
  ]
};

// โครงสร้างของระบบ Breaking Glass
const BG_ROOMS = ["Lobby", "Security", "MDB", "UPS & Battery", "Staging", "NOC", "MMR", "ODF", "Service-1", "Service-2", "Service-3", "Service-4", "Data Center-1", "Data Center-2", "Data Center-3", "Data Center-4", "Nitro-1", "Nitro-2", "Emergency-Red", "Building Door", "Storage", "Fuel", "TR", "Synchronize"];
const BG_ROOMS_IDS = ["lobby", "sec", "mdb", "ups", "stage", "noc", "mmr", "odf", "srv1", "srv2", "srv3", "srv4", "dc1", "dc2", "dc3", "dc4", "nit1", "nit2", "emg", "door", "stor", "fuel", "tr", "sync"];
const BG_QUESTIONS = [
  "1. กระจกบนตัวอุปกรณ์อยู่ในสภาพปกติไม่มีรอยแตกหรือร้าว",
  "2. มีตัวอักษรแสดงเห็นชัดเจน",
  "3. มีกุญแจสำหรับไขทดสอบและไขคืนค่าการทำงาน",
  "4. อุปกรณ์อยู่ในสภาพพร้อมใช้งาน",
  "5. ระบบสามารถทำการปลดล็อคประตูได้ปกติ"
];
const BG_Q_IDS = ["q1", "q2", "q3", "q4", "q5"];


// =========================================================================
// 2. HELPER & UTILITY FUNCTIONS
// =========================================================================

function getColumnsForRoom(roomName) {
  if (!roomName) return [];
  for (const [key, cols] of Object.entries(SYSTEM_COLUMNS)) {
    if (roomName.includes(key)) return cols;
  }
  return [];
}

function getSystemIcon(systemName) {
  if (systemName.includes('Electrical')) return 'bi-lightning-charge-fill';
  if (systemName.includes('UPS')) return 'bi-battery-charging';
  if (systemName.includes('Temperature')) return 'bi-thermometer-half';
  if (systemName.includes('Fire Annunciator')) return 'bi-bell-fill';
  if (systemName.includes('Fire Suppression')) return 'bi-fire';
  if (systemName.includes('Water Leak')) return 'bi-droplet-fill';
  if (systemName.includes('Access Control')) return 'bi-shield-lock-fill';
  if (systemName.includes('CCTV')) return 'bi-camera-video-fill';
  if (systemName.includes('Check Rack')) return 'bi-server';
  if (systemName.includes('Generator')) return 'bi-gear-wide-connected';
  if (systemName.includes('Fuel')) return 'bi-fuel-pump-fill';
  if (systemName.includes('Breaking Glass')) return 'bi-exclamation-triangle-fill';
  return 'bi-gear-wide-connected';
}

function showLoader(text) { 
  document.getElementById('loadingText').innerText = text || 'Processing...'; 
  document.getElementById('overlay').style.display = 'block'; 
}

function hideLoader() { 
  document.getElementById('overlay').style.display = 'none'; 
}

function formatDateDisplay(dateStr) { 
  if(!dateStr) return ''; 
  let d = new Date(dateStr); 
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-GB'); 
}


// =========================================================================
// 3. AUTHENTICATION (LOGIN/REGISTER)
// =========================================================================

function checkAuth() {
  const token = localStorage.getItem('jwt_token');
  if (!token) {
    document.getElementById('sidebar-wrapper').style.display = 'none';
    document.querySelector('.navbar').style.display = 'none';
    switchView('login');
    return false;
  }
  document.getElementById('sidebar-wrapper').style.display = 'block';
  document.querySelector('.navbar').style.display = 'flex';
  return true;
}

function getUsernameFromToken() {
  const token = localStorage.getItem('jwt_token');
  if (!token) return 'Unknown User';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub; 
  } catch (e) {
    return 'Unknown User';
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('jwt_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function handleLogin(e) {
  e.preventDefault(); 
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  showLoader('Signing in...');
  try {
    const response = await fetch('http://127.0.0.1:8000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    hideLoader();

    if (response.ok) {
      localStorage.setItem('jwt_token', data.access_token);
      document.getElementById('loginForm').reset();
      checkAuth();
      switchView('dashboard');
    } else {
      Swal.fire({ icon: 'error', title: 'Login Failed', text: data.detail });
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to server.' });
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const first_name = document.getElementById('regFirstName').value.trim();
  const last_name = document.getElementById('regLastName').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  if (!first_name || !last_name || !password) {
    Swal.fire({ icon: 'warning', title: 'Missing Info', text: 'Please fill out all fields.' });
    return;
  }

  showLoader('Creating account...');
  try {
    const response = await fetch('http://127.0.0.1:8000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name, last_name, password })
    });

    const data = await response.json();
    hideLoader();

    if (response.ok) {
      Swal.fire({ 
        icon: 'success', 
        title: 'Account Created!', 
        html: `Your generated username is:<br><br><strong class="fs-4 text-primary">${data.message}</strong><br><br>Please use this to log in.`,
        confirmButtonColor: '#0F172A'
      }).then(() => {
        document.getElementById('registerForm').reset();
        toggleAuthForm('login');
      });
    } else {
      Swal.fire({ icon: 'error', title: 'Registration Failed', text: data.detail });
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Could not connect to server.' });
  }
}

function toggleAuthForm(view) {
  if (view === 'register') {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('registerSection').style.display = 'block';
  } else {
    document.getElementById('registerSection').style.display = 'none';
    document.getElementById('loginSection').style.display = 'block';
  }
}

function logout() {
  localStorage.removeItem('jwt_token');
  checkAuth();
}


// =========================================================================
// 4. NAVIGATION & VIEW MANAGEMENT
// =========================================================================

document.getElementById("menu-toggle")?.addEventListener("click", function(e) {
  e.preventDefault(); 
  document.getElementById("wrapper").classList.toggle("toggled");
});

function switchView(view) {
  const views = ['dashboardView', 'formView', 'tableView', 'subSelectionView', 'loginView', 'analyticsView', 'reportView'];
  views.forEach(v => {
    const el = document.getElementById(v);
    if(el) el.style.display = 'none';
  });

  document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));

  if (view === 'login') { 
    document.getElementById('loginView').style.display = 'block'; 
  } 
  else if (view === 'dashboard') {
    document.getElementById('dashboardView').style.display = 'block'; 
    document.getElementById('nav-dashboard').classList.add('active'); 
    updateDashboardStatus();
  } 
  else if (view === 'table') {
    document.getElementById('tableView').style.display = 'block';
    document.getElementById('nav-table').classList.add('active'); 
    loadTableData();
  }
  else if (view === 'analytics') {
    document.getElementById('analyticsView').style.display = 'block';
    document.getElementById('nav-analytics').classList.add('active');
    loadAnalyticsData(); 
  }
  else if (view === 'formView') { document.getElementById('formView').style.display = 'block'; }
  else if (view === 'subSelectionView') { document.getElementById('subSelectionView').style.display = 'block'; }
  else if (view === 'reportView') { document.getElementById('reportView').style.display = 'block'; }

  if (window.innerWidth < 768) { document.getElementById("wrapper").classList.remove("toggled"); }
}


// =========================================================================
// 5. DASHBOARD & FORM HANDLING
// =========================================================================

function updateDashboardStatus() {
  const items = document.querySelectorAll('#dashboardView .system-list-item');
  items.forEach(item => {
    const onclickAttr = item.getAttribute('onclick');
    if (!onclickAttr) return;
    
    const match = onclickAttr.match(/'([^']+)'/);
    if (!match) return;
    const roomName = match[1];

    const iconBox = item.querySelector('.system-icon-box');
    const statusIcon = item.querySelector('.bi-chevron-right, .bi-check-circle-fill');
    let isComplete = false;

    if (roomName === 'Electrical System') {
      const subs = ["1.1 MDB", "1.2 PDU", "1. RMU & TROP"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    }
    else if (roomName === 'UPS System') {
      const subs = ["2.1 UPS 2000-G & Battery", "2. UPS 5000-E & Battery"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    } 
    else if (roomName === 'Temperature System') { 
      const subs = ["3.1 Service Room 1", "3.2 Service Room 2", "3.3 Service Room 3", "3.4 Service Room 4", "3. UPS & Battery Room"];
      isComplete = subs.every(sub => completedRooms.includes(roomName + " - " + sub));
    } 
    else {
      isComplete = completedRooms.includes(roomName);
    }

    if (isComplete) {
      iconBox.classList.add('icon-completed');
      if (statusIcon) statusIcon.className = 'bi bi-check-circle-fill text-success fs-5'; 
    } else {
      iconBox.classList.remove('icon-completed');
      if (statusIcon) statusIcon.className = 'bi bi-chevron-right text-muted'; 
    }
  });
}

function openForm(roomName) {
  try { resetForm(); } catch (error) { console.warn("Reset error:", error); }

  if (roomName === 'Electrical System') {
    openSubSelection(roomName, ["1.1 MDB", "1.2 PDU", "1. RMU & TROP"]);
    return;
  }
  if (roomName === 'UPS System') {
    openSubSelection(roomName, ["2.1 UPS 2000-G & Battery", "2. UPS 5000-E & Battery"]);
    return;
  }
  if (roomName === 'Temperature System') {
    openSubSelection(roomName, ["3.1 Service Room 1", "3.2 Service Room 2", "3.3 Service Room 3", "3.4 Service Room 4","3. UPS & Battery Room"]);
    return;
  }

  // Hide all dynamic forms first
  document.querySelectorAll('.dynamic-form-group').forEach(el => el.style.display = 'none');

  if (roomName.includes('1.1 MDB')) document.getElementById('form-mdb').style.display = 'block';
  else if (roomName.includes('1.2 PDU')) document.getElementById('form-pdu').style.display = 'block';
  else if (roomName.includes('1. RMU & TROP')) document.getElementById('form-rmu').style.display = 'block';
  
  else if (roomName.includes('2.1 UPS 2000-G')) document.getElementById('form-ups-2000-g').style.display = 'block';
  else if (roomName.includes('2. UPS 5000-E')) document.getElementById('form-ups-5000-e').style.display = 'block';
  
  else if (roomName.includes('3.1 Service Room 1')) document.getElementById('form-temp-sr1').style.display = 'block';
  else if (roomName.includes('3.2 Service Room 2')) document.getElementById('form-temp-sr2').style.display = 'block';
  else if (roomName.includes('3.3 Service Room 3')) document.getElementById('form-temp-sr3').style.display = 'block';
  else if (roomName.includes('3.4 Service Room 4')) document.getElementById('form-temp-sr4').style.display = 'block';
  else if (roomName.includes('3. UPS & Battery Room')) document.getElementById('form-temp-ups').style.display = 'block';

  else if (roomName === 'Fire Annunciator Panel System') document.getElementById('form-fire-annunciator').style.display = 'block';
  else if (roomName === 'Fire Suppression System') document.getElementById('form-fire-suppression').style.display = 'block';
  else if (roomName === 'Water Leak Detection System') document.getElementById('form-water-leak').style.display = 'block';
  else if (roomName === 'Access Control System') document.getElementById('form-access-control').style.display = 'block';
  else if (roomName === 'CCTV') document.getElementById('form-cctv').style.display = 'block';
  else if (roomName === 'Check Rack Customer') document.getElementById('form-check-rack').style.display = 'block';
  else if (roomName === 'Generator System') document.getElementById('form-generator').style.display = 'block';
  else if (roomName === 'Fuel System') document.getElementById('form-fuel').style.display = 'block';
  else if (roomName === 'Breaking Glass') document.getElementById('form-breaking-glass').style.display = 'block';

  document.getElementById('room').value = roomName;
  document.getElementById('formTitle').innerText = roomName;
  document.getElementById('name').value = getUsernameFromToken(); 
  
  switchView('formView');
}

function openSubSelection(mainSystemName, subCategories) {
  switchView('subSelectionView');
  document.getElementById('subSelectionTitle').innerText = mainSystemName;
  
  const container = document.getElementById('subCategoryContainer');
  container.innerHTML = '';
  const systemIcon = getSystemIcon(mainSystemName);

  subCategories.forEach(sub => {
    const fullRoomName = mainSystemName + " - " + sub;
    const isCompleted = completedRooms.includes(fullRoomName);
    const completedClass = isCompleted ? 'icon-completed' : '';
    
    const checkmark = isCompleted ? '<i class="bi bi-check-circle-fill text-success position-absolute" style="top: 15px; right: 15px; font-size: 1.5rem; z-index: 2;"></i>' : '';

    const col = document.createElement('div');
    col.className = 'col-12 col-md-4';
    col.innerHTML = `
      <div class="card room-card bg-white p-4 h-100 position-relative" onclick="openForm('${fullRoomName}')">
        ${checkmark}
        <i class="bi ${systemIcon} ${completedClass} room-icon fs-1"></i>
        <h5 class="fw-bold mb-0">${sub}</h5>
      </div>
    `;
    container.appendChild(col);
  });
}

function resetForm() {
  currentEditingId = null; 
  const form = document.getElementById('maintenanceForm');
  if(form) {
    form.reset();
    form.classList.remove('was-validated');
  }
  document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
  
  const now = new Date(); 
  document.getElementById('date').valueAsDate = now;
  document.getElementById('time').value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const backBtn = document.getElementById('btnFormBack');
  if (backBtn) backBtn.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Back to Dashboard';
}

function handleFormBack() {
  if (currentEditingId) {
    switchView('table');
    currentEditingId = null; 
  } else {
    switchView('dashboard');
  }
}

function selectAllNormal() {
  let activeForm = null;
  const allForms = document.querySelectorAll('.dynamic-form-group');
  allForms.forEach(form => {
    if (form.style.display === 'block' || form.style.display.includes('block')) {
      activeForm = form;
    }
  });
  
  if (!activeForm) {
    Swal.fire({ icon: 'info', title: 'No Form Open', text: 'Please select a system first.' });
    return;
  }

  const goodValues = ['normal', 'on', 'auto', 'open', 'full', 'high', 'source-a'];
  let selectedCount = 0;

  const radios = activeForm.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    const val = radio.value.trim().toLowerCase(); 
    const name = radio.name; 

    if (name === 'fuel_run1' || name === 'fuel_run2') {
      if (val === 'off') {
        radio.checked = true;
        selectedCount++;
      }
      return; 
    }

    if (goodValues.includes(val)) {
      radio.checked = true;
      selectedCount++;
    }
  });

  const selects = activeForm.querySelectorAll('select');
  selects.forEach(select => {
    if (select.name !== 'cr_shift') {
      select.selectedIndex = 0; 
      selectedCount++;
    }
  });

  if (selectedCount > 0) {
    Swal.fire({ icon: 'success', title: 'Auto-Filled', text: `Checked ${selectedCount} items!`, timer: 1200, showConfirmButton: false, position: 'top-end', toast: true });
  } else {
    Swal.fire({ icon: 'warning', title: 'No Items Found', text: 'Could not find any standard values to auto-fill.' });
  }
}

async function submitData() {
  const form = document.getElementById('maintenanceForm');
  
  if (!document.getElementById('date').value || !document.getElementById('time').value) { 
    form.classList.add('was-validated'); 
    Swal.fire({ icon: 'warning', title: 'Incomplete data', text: 'Please fill in Date and Time.' });
    return; 
  }

  let extraData = {};
  let missingField = false; 

  const visibleForms = document.querySelectorAll('.dynamic-form-group');
  visibleForms.forEach(formGroup => {
    if (window.getComputedStyle(formGroup).display === 'block') {
      
      const allInputs = formGroup.querySelectorAll('input:not([type="radio"]), select, textarea');
      allInputs.forEach(input => {
        const key = input.name || input.id;
        const val = input.value.trim();
        const lowerKey = (key || '').toLowerCase();

        if (val === '' && !lowerKey.includes('remark')) {
          missingField = true;
          input.classList.add('is-invalid'); 
        } else {
          input.classList.remove('is-invalid');
          if (key) extraData[key] = val;
        }
      });

      const checkedRadios = formGroup.querySelectorAll('input[type="radio"]:checked');
      checkedRadios.forEach(radio => {
        if (radio.name) extraData[radio.name] = radio.value;
      });
    }
  });

  if (missingField) {
    Swal.fire({ icon: 'warning', title: 'Incomplete Data', text: 'Please fill in all required fields.' });
    return; 
  }

  showLoader('Saving to ' + document.getElementById('room').value + '...');

  const payload = {
    id: currentEditingId, 
    room: document.getElementById('room').value,
    name: document.getElementById('name').value, 
    date: document.getElementById('date').value,
    time: document.getElementById('time').value,
    extra_data: extraData
  };
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    hideLoader();

    if (response.ok) {
      if (!completedRooms.includes(payload.room)) {
        completedRooms.push(payload.room);
      }
      Swal.fire({ icon: 'success', title: 'Success!', text: result.message, confirmButtonColor: '#0F172A', timer: 1500 })
        .then(() => { 
          if (currentEditingId) {
            switchView('table');
            currentEditingId = null;
          } else {
            switchView('dashboard'); 
          } 
        });
    } else { 
      if (response.status === 401) {
        Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Please log in again.' }).then(() => logout());
      } else {
        Swal.fire({ icon: 'error', title: 'Error', text: result.detail || result.message }); 
      }
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}


// =========================================================================
// 6. TABLE & HISTORY (EDIT LOGIC)
// =========================================================================

async function loadTableData() {
  showLoader('Loading history...');
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    const records = await response.json();
    hideLoader();
    if (response.ok) {
      currentRecords = records;
      populateFilterDropdown(); 
      applyHistoryFilter();     
    } else { 
      if (response.status === 401) {
        Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Your security token expired. Please log in again.' }).then(() => logout());
      } else {
        Swal.fire({ icon: 'error', title: 'Database Error', text: records.detail || 'Failed to load records' }); 
      }
    }
  } catch (error) { 
    hideLoader(); 
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' }); 
  }
}

function populateFilterDropdown() {
  const filterSelect = document.getElementById('historyFilter');
  const currentValue = filterSelect.value;
  const uniqueRooms = [...new Set(currentRecords.map(r => r.room))].filter(Boolean).sort();
  
  filterSelect.innerHTML = '<option value="all">All Systems</option>';
  uniqueRooms.forEach(room => {
    const option = document.createElement('option');
    option.value = room;
    option.textContent = room;
    filterSelect.appendChild(option);
  });
  
  if (uniqueRooms.includes(currentValue)) filterSelect.value = currentValue;
}

function applyHistoryFilter() {
  const selectedRoom = document.getElementById('historyFilter').value;
  if (selectedRoom === 'all') {
    renderTable(currentRecords);
  } else {
    const filteredData = currentRecords.filter(r => r.room === selectedRoom);
    renderTable(filteredData);
  }
}

function renderTable(records) {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = records.length ? '' : '<tr><td colspan="5" class="text-center py-4">No records found.</td></tr>';
  
  records.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
          <td>${formatDateDisplay(r.date)}</td>
          <td>${r.time}</td>
          <td><span class="fw-semibold text-dark">${r.room || '-'}</span></td>
          <td class="fw-bold">${r.name}</td>
          <td>
              <button class="btn btn-sm btn-corporate-outline" onclick="editRecord('${r.id}')">
                  <i class="bi bi-pencil"></i> Edit
              </button>
          </td>
      `;
      tbody.appendChild(tr);
  });
}

function viewRoomHistory() {
  const currentRoom = document.getElementById('room').value; 
  switchView('table'); 
  
  setTimeout(() => {
    const filterSelect = document.getElementById('historyFilter');
    if ([...filterSelect.options].some(opt => opt.value === currentRoom)) {
      filterSelect.value = currentRoom;
      applyHistoryFilter(); 
    } else {
      filterSelect.value = 'all';
      applyHistoryFilter();
      Swal.fire({ icon: 'info', title: 'No History', text: `No past records found for ${currentRoom}`, timer: 2000, showConfirmButton: false});
    }
  }, 400); 
}

function editRecord(id) {
  const searchId = isNaN(Number(id)) ? id : Number(id);
  const record = currentRecords.find(r => r.id === searchId || String(r.id) === String(id));
  if (!record) return;

  openForm(record.room || 'Unknown Room'); 
  
  currentEditingId = record.id; 
  document.getElementById('name').value = record.name || ''; 

  try { let d = new Date(record.date); document.getElementById('date').value = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : record.date; } catch(e) {}
  try { let t = new Date('1970-01-01T' + record.time); document.getElementById('time').value = !isNaN(t.getTime()) ? `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}` : record.time; } catch(e) {}

  if(record.extra_data) {
    for (const [key, value] of Object.entries(record.extra_data)) {
      const targetInputs = document.querySelectorAll(`[name="${key}"], #${key}`);
      
      targetInputs.forEach(input => {
        if (input.type === 'radio' || input.type === 'checkbox') {
          if (input.value === String(value)) {
            input.checked = true;
          }
        } else {
          input.value = value;
        }
      });
    }
  }
  document.getElementById('formTitle').innerText = "Edit Record: " + (record.room || '');

  const backBtn = document.getElementById('btnFormBack');
  if (backBtn) backBtn.innerHTML = '<i class="bi bi-arrow-left me-1"></i> Back to History';
}


// =========================================================================
// 7. ANALYTICS & CHARTS
// =========================================================================

let barChartInstance = null;
let doughnutChartInstance = null;
let trendChartInstance = null;
let offendersChartInstance = null;

async function loadAnalyticsData() {
  showLoader('Loading Analytics...');
  try {
    const response = await fetch(API_URL, { headers: getAuthHeaders() });
    const records = await response.json();
    hideLoader();
    
    if (response.ok) {
        currentRecords = records;
        populateMonthDropdown();
        renderAnalytics();
    } else {
        if (response.status === 401) {
            Swal.fire({ icon: 'warning', title: 'Session Expired', text: 'Your security token expired. Please log in again.' }).then(() => logout());
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: records.detail || 'Failed to load analytics' });
        }
    }
  } catch (error) {
    hideLoader();
    Swal.fire({ icon: 'error', title: 'Network Error', text: 'Cannot connect to Server.' });
  }
}

function populateMonthDropdown() {
  const filter = document.getElementById('monthFilter');
  const currentVal = filter.value;
  
  const months = [...new Set(currentRecords.map(r => r.date.substring(0, 7)))].sort().reverse();
  
  filter.innerHTML = '<option value="all">All Time</option>';
  months.forEach(m => {
    const dateObj = new Date(m + '-01');
    const monthName = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    filter.innerHTML += `<option value="${m}">${monthName}</option>`;
  });
  
  if (months.includes(currentVal)) filter.value = currentVal;
}

function renderAnalytics() {
  const selectedMonth = document.getElementById('monthFilter').value;
  
  const data = selectedMonth === 'all' 
    ? currentRecords 
    : currentRecords.filter(r => r.date.startsWith(selectedMonth));

  let systemCounts = {};
  let systemIssues = {}; 
  let issuesByDate = {}; 

  const allDates = [...new Set(data.map(r => r.date))].sort();
  allDates.forEach(d => issuesByDate[d] = 0);

  const goodValues = ['normal', 'on', 'auto', 'open', 'full', 'high', 'source-a'];
  const badValues = ['failed', 'abnormal', 'off', 'manual', 'close', 'low', 'medium', 'source-b'];

  let normalItemsCount = 0;
  let issuesItemsCount = 0;

  data.forEach(r => {
    const room = r.room || 'Unknown';
    systemCounts[room] = (systemCounts[room] || 0) + 1;
    const date = r.date;

    if (r.extra_data) {
      Object.entries(r.extra_data).forEach(([key, val]) => {
        if (typeof val === 'string' && val.trim() !== '') {
          const cleanVal = val.trim().toLowerCase();
          let isIssue = false; 
          
          if (key === 'fuel_run1' || key === 'fuel_run2') {
            if (cleanVal === 'off') {
              normalItemsCount++; 
            } else if (cleanVal === 'run') {
              issuesItemsCount++; 
              isIssue = true;
            }
          } else {
            if (goodValues.includes(cleanVal)) {
              normalItemsCount++; 
            } else if (badValues.includes(cleanVal)) {
              issuesItemsCount++; 
              isIssue = true;
            }
          }

          if (isIssue) {
            systemIssues[room] = (systemIssues[room] || 0) + 1;
            issuesByDate[date] = (issuesByDate[date] || 0) + 1;
          }
        }
      });
    }
  });

  const totalItemsChecked = normalItemsCount + issuesItemsCount;

  document.getElementById('statTotalChecks').innerText = totalItemsChecked; 
  document.getElementById('statNormal').innerText = normalItemsCount;
  document.getElementById('statIssues').innerText = issuesItemsCount;

  const healthPercent = totalItemsChecked === 0 ? 100 : Math.round((normalItemsCount / totalItemsChecked) * 100);
  document.getElementById('healthPercentage').innerText = healthPercent + '%';

  // 1. Total Inspections by System (Bar Chart)
  const ctxBar = document.getElementById('barChart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy(); 
  
  const niceLabels = Object.keys(systemCounts).map(label => {
    if(label.includes(' - ')) return label.split(' - ')[1];
    return label;
  });

  let gradient = ctxBar.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, 'rgba(59, 130, 246, 1)'); 
  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

  barChartInstance = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: niceLabels,
      datasets: [{
        label: 'Total Inspections',
        data: Object.values(systemCounts),
        backgroundColor: gradient,
        borderRadius: 6,
        barThickness: 'flex',
        maxBarThickness: 45
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, 
      plugins: { legend: { display: false } },
      scales: { 
        y: { beginAtZero: true, grid: { color: '#F1F5F9', drawBorder: false }, border: { display: false } },
        x: { grid: { display: false, drawBorder: false }, border: { display: false }, ticks: { font: { family: 'Inter', size: 11 } } }
      } 
    }
  });

  // 2. Health Status (Doughnut Chart)
  const ctxDoughnut = document.getElementById('doughnutChart').getContext('2d');
  if (doughnutChartInstance) doughnutChartInstance.destroy(); 
  
  doughnutChartInstance = new Chart(ctxDoughnut, {
    type: 'doughnut',
    data: {
      labels: ['Healthy', 'Anomalies'],
      datasets: [{
        data: [normalItemsCount, issuesItemsCount],
        backgroundColor: ['#10B981', '#EF4444'],
        hoverBackgroundColor: ['#059669', '#DC2626'],
        borderWidth: 0, hoverOffset: 6
      }]
    },
    options: { 
      responsive: true, maintainAspectRatio: false, cutout: '82%', 
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
      }
    }
  });

  // 3. Issues Trend Over Time (Line Chart)
  const ctxTrend = document.getElementById('trendChart').getContext('2d');
  if (trendChartInstance) trendChartInstance.destroy();

  const trendLabels = Object.keys(issuesByDate).map(d => {
      const dateObj = new Date(d);
      return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  });
  const trendData = Object.values(issuesByDate);

  trendChartInstance = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: trendLabels,
      datasets: [{
        label: 'Issues Found',
        data: trendData,
        borderColor: '#ff7979',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#ff7979'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, suggestedMax: 5 },
        x: { grid: { display: false } }
      }
    }
  });

  // 4. Top Offenders (Horizontal Bar Chart)
  const ctxOffenders = document.getElementById('offendersChart').getContext('2d');
  if (offendersChartInstance) offendersChartInstance.destroy();

  const sortedOffenders = Object.entries(systemIssues)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  
  const offenderLabels = sortedOffenders.map(item => {
      let label = item[0];
      if(label.includes(' - ')) return label.split(' - ')[1];
      return label;
  });
  const offenderData = sortedOffenders.map(item => item[1]);

  let gradientOrange = ctxOffenders.createLinearGradient(0, 0, 400, 0); 
  gradientOrange.addColorStop(0, 'rgba(245, 158, 11, 0.4)'); 
  gradientOrange.addColorStop(1, 'rgb(255, 109, 109)');  

  offendersChartInstance = new Chart(ctxOffenders, {
    type: 'bar',
    data: {
      labels: offenderLabels,
      datasets: [{
        label: 'Anomalies',
        data: offenderData,
        backgroundColor: gradientOrange, 
        borderRadius: 4,
        barThickness: 'flex',
        maxBarThickness: 25
      }]
    },
    options: {
      indexAxis: 'y', 
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, suggestedMax: 5, grid: { color: '#F1F5F9', drawBorder: false }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } }
      }
    }
  });
}


// =========================================================================
// 8. REPORTING & EXPORT (WEB / EXCEL)
// =========================================================================

function generateAndShowReport() {
  const filterValue = document.getElementById('historyFilter').value;
  const reportContainer = document.getElementById('reportContainer');
  
  let reportData = currentRecords;
  if (filterValue !== 'all') {
    reportData = currentRecords.filter(r => r.room === filterValue);
  }

  if (reportData.length === 0) {
    Swal.fire({ icon: 'info', title: 'No Data', text: 'No data available to print.' });
    return;
  }

  const now = new Date();
  const filterText = filterValue === 'all' ? 'All Systems Summary' : filterValue;

  let html = `
    <style>
      .report-scroll-box { max-height: 65vh; overflow: auto; white-space: nowrap; }
      .report-sticky-header { position: sticky; top: 0; z-index: 2; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
      @media print {
        .report-scroll-box { max-height: none !important; overflow: visible !important; white-space: nowrap !important; }
        .report-sticky-header { position: static !important; box-shadow: none !important; }
      }
    </style>
    <div class="pt-3 px-0"> 
      <div class="report-header text-center mt-0 pt-0" style="padding-bottom: 10px; margin-bottom: 20px;">
        <h2 class="fw-bold mb-1 mt-0 pt-0" style="letter-spacing: 0.05em;">MONTHLY MAINTENANCE REPORT</h2>
        <p class="text-muted mb-0 text-uppercase">${filterText}</p>
      </div>
      <div class="row mb-4 fs-6">
        <div class="col-12 text-end"><strong>Date:</strong> ${now.toLocaleDateString('en-GB')}</div>
      </div>
  `;

  const groupedRecords = {};
  reportData.forEach(r => {
    const room = r.room || 'Unknown System';
    if (!groupedRecords[room]) groupedRecords[room] = [];
    groupedRecords[room].push(r);
  });

  for (const [roomName, records] of Object.entries(groupedRecords)) {
    html += `<h5 class="fw-bold mt-5 mb-2 text-dark" style="border-bottom: 2px solid #0F172A; padding-bottom: 5px;">${roomName}</h5>`;
    
    // ================== Breaking Glass Layout ==================
    if (roomName === 'Breaking Glass') {
      html += `
        <div class="table-responsive report-scroll-box shadow-sm rounded border mb-5">
          <table class="table table-bordered report-table align-middle text-center mb-0" style="font-size: 8pt;">
            <thead class="table-light report-sticky-header">
              <tr>
                <th rowspan="2" style="width: 80px; vertical-align: middle;">Date</th>
                <th rowspan="2" style="width: 60px; vertical-align: middle;">Time</th>`;
      
      BG_QUESTIONS.forEach(q => {
        html += `<th colspan="24" style="background: #e2e8f0; font-size: 8.5pt;">${q}</th>`;
      });
      
      html += `<th rowspan="2" style="vertical-align: middle;">Remark</th>
               <th rowspan="2" style="vertical-align: middle;">Check by</th>
              </tr><tr>`;
      
      BG_QUESTIONS.forEach(() => {
        BG_ROOMS.forEach(r => html += `<th style="background: #f8fafc; font-size: 7pt; width: 60px;">${r}</th>`);
      });
      
      html += `</tr></thead><tbody>`;

      records.forEach(r => {
        html += `<tr><td>${formatDateDisplay(r.date)}</td><td>${r.time}</td>`;
        BG_Q_IDS.forEach(qId => {
          BG_ROOMS_IDS.forEach(rId => {
            let val = (r.extra_data && r.extra_data[`bg_${qId}_${rId}`]) ? r.extra_data[`bg_${qId}_${rId}`] : '-';
            html += `<td>${val}</td>`;
          });
        });
        html += `<td>${(r.extra_data && r.extra_data['bg_remark']) ? r.extra_data['bg_remark'] : '-'}</td>`;
        html += `<td class="fw-bold text-muted">${r.name || '-'}</td></tr>`;
      });

      html += `</tbody></table></div>`;
    } 
    // ================== Normal Layout (with Group Support) ==================
    else {
      const configCols = getColumnsForRoom(roomName);
      let columnsArray = [];
      let labelMap = {};

      if (configCols.length > 0) {
        columnsArray = configCols.map(c => c.key);
        configCols.forEach(c => labelMap[c.key] = c.label);
      } else {
        let dynamicColumns = new Set();
        records.forEach(r => { if (r.extra_data) Object.keys(r.extra_data).forEach(key => dynamicColumns.add(key)); });
        columnsArray = Array.from(dynamicColumns);
        columnsArray.forEach(k => labelMap[k] = k.replace(/_/g, ' ').toUpperCase());
      }

      let groupConfig = null;
      for (const [key, group] of Object.entries(SYSTEM_GROUPS)) {
        if (roomName.includes(key)) {
          groupConfig = group;
          break;
        }
      }
      let hasGroup = groupConfig !== null;

      html += `
        <div class="table-responsive report-scroll-box shadow-sm rounded border mb-5">
          <table class="table table-bordered report-table align-middle text-center mb-0" style="font-size: 8.5pt;">
            <thead class="table-light report-sticky-header">`;

      // 🌟 ถ้าระบบนี้มีการจัดกลุ่มหัวตาราง (2 ชั้น)
      if (hasGroup) {
        html += `<tr>
                  <th rowspan="2" style="width: 80px; vertical-align: middle;">Date</th>
                  <th rowspan="2" style="width: 60px; vertical-align: middle;">Time</th>`;
        groupConfig.forEach(g => {
          html += `<th colspan="${g.colspan}" style="background: #e2e8f0; font-size: 9pt;">${g.label}</th>`;
        });
        html += `<th rowspan="2" style="vertical-align: middle;">Check by</th>
                 </tr><tr>`;
        columnsArray.forEach(col => {
          html += `<th style="background: #f8fafc; font-size: 7.5pt;">${labelMap[col] || col}</th>`;
        });
        html += `</tr>`;
      } 
      // 🌟 ถ้าระบบปกติ (ชั้นเดียว)
      else {
        html += `<tr><th style="width: 80px;">Date</th><th style="width: 60px;">Time</th>`;
        columnsArray.forEach(col => html += `<th>${labelMap[col] || col}</th>`);
        html += `<th>Check by</th></tr>`;
      }
      
      html += `</thead><tbody>`;

      records.forEach(r => {
        html += `<tr><td>${formatDateDisplay(r.date)}</td><td>${r.time}</td>`;
        columnsArray.forEach(col => {
          let val = (r.extra_data && r.extra_data[col] !== undefined && r.extra_data[col] !== "") ? r.extra_data[col] : '-';
          if (!isNaN(val) && val !== '-') val = Number(val).toLocaleString(); 
          html += `<td>${val}</td>`;
        });
        html += `<td class="fw-bold text-muted">${r.name || '-'}</td></tr>`;
      });
      html += `</tbody></table></div>`;
    }
  } 

  html += `</div>`;
  reportContainer.innerHTML = html;
  switchView('reportView');
}

function exportReportToExcel() {
  const filterValue = document.getElementById('historyFilter').value;
  
  let reportData = currentRecords;
  if (filterValue !== 'all') {
    reportData = currentRecords.filter(r => r.room === filterValue);
  }

  if (reportData.length === 0) {
    Swal.fire({ icon: 'info', title: 'No Data', text: 'No data available to export.' });
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  const titleText = filterValue === 'all' ? 'System: All Systems Summary' : `System: ${filterValue}`;

  const rows = [];
  const merges = [];
  
  // 🌟 สร้างบรรทัดแรกสุด (ชื่อระบบ)
  rows.push([titleText]);

  // ================== Breaking Glass Excel ==================
  if (filterValue === 'Breaking Glass') {
    const r1 = ['Date', 'Time'];
    BG_QUESTIONS.forEach(q => {
      r1.push(q);
      for(let i=0; i<23; i++) r1.push(''); 
    });
    r1.push('Remark', 'Check by');
    rows.push(r1); 

    const r2 = ['', '']; 
    BG_QUESTIONS.forEach(() => { BG_ROOMS.forEach(r => r2.push(r)); });
    r2.push('', '');
    rows.push(r2); 

    reportData.forEach(r => {
      const dataRow = [formatDateDisplay(r.date), r.time];
      BG_Q_IDS.forEach(qId => {
        BG_ROOMS_IDS.forEach(rId => {
          dataRow.push((r.extra_data && r.extra_data[`bg_${qId}_${rId}`]) ? r.extra_data[`bg_${qId}_${rId}`] : '-');
        });
      });
      dataRow.push((r.extra_data && r.extra_data['bg_remark']) ? r.extra_data['bg_remark'] : '-');
      dataRow.push(r.name || '-');
      rows.push(dataRow);
    });

    // Merge Cells
    merges.push({s: {r:0, c:0}, e: {r:0, c: 1 + (BG_QUESTIONS.length * 24) + 2}}); // Title Merge
    merges.push({s: {r:1, c:0}, e: {r:2, c:0}}); // Date
    merges.push({s: {r:1, c:1}, e: {r:2, c:1}}); // Time
    
    let startCol = 2;
    BG_QUESTIONS.forEach(() => {
      merges.push({s: {r:1, c:startCol}, e: {r:1, c:startCol + 23}});
      startCol += 24;
    });

    merges.push({s: {r:1, c:startCol}, e: {r:2, c:startCol}}); 
    merges.push({s: {r:1, c:startCol + 1}, e: {r:2, c:startCol + 1}}); 
  } 
  // ================== Normal / Grouped Excel ==================
  else {
    let columnsArray = [];
    let labelMap = {};

    if (filterValue !== 'all') {
      const configCols = getColumnsForRoom(filterValue);
      if (configCols.length > 0) {
        columnsArray = configCols.map(c => c.key);
        configCols.forEach(c => labelMap[c.key] = c.label);
      }
    } else {
      const activeRooms = [...new Set(reportData.map(r => r.room))].filter(Boolean);
      let collectedKeys = new Set();
      activeRooms.forEach(rm => {
        const configCols = getColumnsForRoom(rm);
        configCols.forEach(c => {
          if (!collectedKeys.has(c.key)) {
            collectedKeys.add(c.key);
            columnsArray.push(c.key);
            labelMap[c.key] = c.label;
          }
        });
      });
    }

    if (columnsArray.length === 0) {
      let dynamicColumns = new Set();
      reportData.forEach(r => { if (r.extra_data) Object.keys(r.extra_data).forEach(key => dynamicColumns.add(key)); });
      columnsArray = Array.from(dynamicColumns);
      columnsArray.forEach(k => labelMap[k] = k.replace(/_/g, ' ').toUpperCase());
    }

    let groupConfig = null;
    if (filterValue !== 'all') {
      for (const [key, group] of Object.entries(SYSTEM_GROUPS)) {
        if (filterValue.includes(key)) {
          groupConfig = group;
          break;
        }
      }
    }
    let hasGroup = groupConfig !== null;

    if (hasGroup) {
      const groupConfig = SYSTEM_GROUPS[filterValue];
      const r1 = ['Date', 'Time'];
      groupConfig.forEach(g => {
        r1.push(g.label);
        for(let i=1; i<g.colspan; i++) r1.push(''); // blank for merge
      });
      r1.push('Check by');
      rows.push(r1);

      const r2 = ['', ''];
      columnsArray.forEach(col => r2.push(labelMap[col] || col));
      r2.push('');
      rows.push(r2);

      merges.push({s: {r:0, c:0}, e: {r:0, c:columnsArray.length + 2}}); // Title Merge
      merges.push({s: {r:1, c:0}, e: {r:2, c:0}}); // Date merge
      merges.push({s: {r:1, c:1}, e: {r:2, c:1}}); // Time merge
      
      let startCol = 2;
      groupConfig.forEach(g => {
        if (g.colspan > 1) merges.push({s: {r:1, c:startCol}, e: {r:1, c:startCol + g.colspan - 1}});
        startCol += g.colspan;
      });
      merges.push({s: {r:1, c:startCol}, e: {r:2, c:startCol}}); // Check by merge
    } else {
      const headers = ['Date', 'Time'];
      columnsArray.forEach(col => headers.push(labelMap[col] || col));
      headers.push('Check by'); 
      rows.push(headers);
      merges.push({s: {r:0, c:0}, e: {r:0, c:columnsArray.length + 2}}); // Title Merge
    }

    reportData.forEach(r => {
      const rowData = [formatDateDisplay(r.date), r.time];
      columnsArray.forEach(col => {
        let val = (r.extra_data && r.extra_data[col] !== undefined && r.extra_data[col] !== "") ? r.extra_data[col] : '-';
        if (!isNaN(val) && val !== '-') val = Number(val); 
        rowData.push(val);
      });
      rowData.push(r.name || '-'); 
      rows.push(rowData);
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!merges'] = merges;
  
  // 🌟 จัดกึ่งกลาง, ฟอนต์หนา และลงสีตารางแบบอัตโนมัติ (Requires xlsx-js-style library in HTML)
  for (let key in ws) {
    if (key[0] === '!') continue; 
    let rowNum = parseInt(key.replace(/[A-Z]/g, ''));
    let isTitleRow = rowNum === 1;
    let isHeaderRow = rowNum === 2 || (merges.some(m => m.e.r === 2) && rowNum === 3);

    ws[key].s = {
      alignment: { horizontal: "center", vertical: "center" },
      font: { bold: isTitleRow || isHeaderRow, sz: isTitleRow ? 14 : 11 }
    };
    if (isHeaderRow) {
       ws[key].s.fill = { fgColor: { rgb: "E2E8F0" } };
    }
  }

  const colWidths = rows[rows.length-1].map(h => ({ wch: Math.max(12, String(h).length + 2) }));
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Maintenance Data");
  const filterName = filterValue === 'all' ? 'All_Systems' : filterValue.replace(/[^a-zA-Z0-9]/g, '_');
  XLSX.writeFile(wb, `Maintenance_Report_${filterName}_${today}.xlsx`);
}

// =========================================================================
// INITIALIZE APP
// =========================================================================
if (checkAuth()) {
  switchView('dashboard');
}