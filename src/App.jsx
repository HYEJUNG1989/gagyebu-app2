import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine, PieChart, Pie, Cell
} from "recharts";

// ── 상수 ────────────────────────────────────────────────────────
const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const C = { 혜정:"#ff6b9d", 현:"#4ecdc4", 공통:"#a78bfa", accent:"#a78bfa",
            순자산:"#f9ca24", 부채:"#ff7070", 수입:"#6bcb77", 지출:"#ff7070" };
const GC = { "대출이자":"#ff7070","공과금":"#a78bfa","용돈/공비":"#4ecdc4","비주기적":"#ff9f43" };
const GCOLS = Object.values(GC);

// ── 2025 초기 데이터 ────────────────────────────────────────────
const INIT_INCOME_CATS = [
  { id:"i1", label:"혜정 월급",     payer:"혜정" },
  { id:"i2", label:"현 월급(한화)", payer:"현"   },
  { id:"i3", label:"현 월급(엔화)", payer:"현"   },
  { id:"i4", label:"호반 월세 수입",payer:"현"   },
  { id:"i5", label:"기타 수입",     payer:"공통" },
];
const INIT_EXPENSE_CATS = [
  { id:"e1",  label:"아빠 대출이자",         payer:"혜정", group:"대출이자" },
  { id:"e2",  label:"하나 마통 이자",         payer:"혜정", group:"대출이자" },
  { id:"e3",  label:"주택청약담보대출(혜정)", payer:"혜정", group:"대출이자" },
  { id:"e4",  label:"카카오 마통 이자",       payer:"현",   group:"대출이자" },
  { id:"e5",  label:"새마을 신용대출 이자",   payer:"현",   group:"대출이자" },
  { id:"e6",  label:"호반 주담대 이자",       payer:"현",   group:"대출이자" },
  { id:"e7",  label:"롯데캐피탈 이자",        payer:"현",   group:"대출이자" },
  { id:"e8",  label:"주택청약담보대출(현)",   payer:"현",   group:"대출이자" },
  { id:"e9",  label:"아파트 관리비",          payer:"현",   group:"공과금"   },
  { id:"e10", label:"인터넷 요금",            payer:"현",   group:"공과금"   },
  { id:"e11", label:"하이패스",               payer:"현",   group:"공과금"   },
  { id:"e12", label:"QM3/유심",               payer:"현",   group:"공과금"   },
  { id:"e13", label:"현 학자금 대출",         payer:"현",   group:"공과금"   },
  { id:"e14", label:"안마의자 할부금",        payer:"현",   group:"공과금"   },
  { id:"e15", label:"QM3 월주차",             payer:"현",   group:"공과금"   },
  { id:"e16", label:"혜정 학자금 대출",       payer:"혜정", group:"공과금"   },
  { id:"e17", label:"혜정 하나적금",          payer:"혜정", group:"공과금"   },
  { id:"e18", label:"혜정 오피스텔 월세",     payer:"혜정", group:"공과금"   },
  { id:"e19", label:"혜정 오피스텔 관리비",   payer:"혜정", group:"공과금"   },
  { id:"e20", label:"주유비",                 payer:"혜정", group:"공과금"   },
  { id:"e21", label:"혜정 용돈",              payer:"혜정", group:"용돈/공비" },
  { id:"e22", label:"현 용돈",                payer:"현",   group:"용돈/공비" },
  { id:"e23", label:"현 공비",                payer:"현",   group:"용돈/공비" },
  { id:"e24", label:"혜정 공비",              payer:"혜정", group:"용돈/공비" },
  { id:"e25", label:"헬리오 재산세",          payer:"혜정", group:"비주기적" },
  { id:"e26", label:"호반 재산세",            payer:"현",   group:"비주기적" },
  { id:"e27", label:"자동차세",               payer:"현",   group:"비주기적" },
  { id:"e28", label:"QM3 보험료",             payer:"현",   group:"비주기적" },
  { id:"e29", label:"BMW 보험료",             payer:"현",   group:"비주기적" },
  { id:"e30", label:"종합부동산세",           payer:"혜정", group:"비주기적" },
  { id:"e31", label:"호반 월세소득 종소세",   payer:"현",   group:"비주기적" },
];
const INIT_ASSET_ITEMS = [
  { id:"a1", label:"송파구 헬리오시티", note:"부동산" },
  { id:"a2", label:"영종 호반써밋",     note:"부동산" },
  { id:"a3", label:"현금성 자산",       note:"금융"   },
];
const INIT_DEBT_ITEMS = [
  { id:"d1", label:"전세보증금"              },
  { id:"d2", label:"하나 마통+주택청약담보대출" },
  { id:"d3", label:"카카오 마통+신용+청약담보"  },
  { id:"d4", label:"새마을은행 신용대출"     },
  { id:"d5", label:"롯데캐피탈 신용대출"     },
  { id:"d6", label:"호반 주담대"             },
  { id:"d7", label:"아빠 차용금액"           },
];

const BALANCE_2025 = [
  { month:"1월",  자산총계:2367601718, 부채총계:1757309885, 순자산:610291833,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:97601718}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:183380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:83800000},{id:"d5",label:"롯데캐피탈 신용대출",value:35291747},{id:"d6",label:"호반 주담대",value:374868138},{id:"d7",label:"아빠 차용금액",value:100000000}]},
  { month:"2월",  자산총계:2387677943, 부채총계:1754411392, 순자산:633266551,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:117677943}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:183380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:83500000},{id:"d5",label:"롯데캐피탈 신용대출",value:33524540},{id:"d6",label:"호반 주담대",value:374036852},{id:"d7",label:"아빠 차용금액",value:100000000}]},
  { month:"3월",  자산총계:2399965066, 부채총계:1751503198, 순자산:648461868,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:129965066}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:183380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:83200000},{id:"d5",label:"롯데캐피탈 신용대출",value:31747632},{id:"d6",label:"호반 주담대",value:373205566},{id:"d7",label:"아빠 차용금액",value:100000000}]},
  { month:"4월",  자산총계:2442336620, 부채총계:1748594280, 순자산:693742340,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:172336620}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:82900000},{id:"d5",label:"롯데캐피탈 신용대출",value:29970000},{id:"d6",label:"호반 주담대",value:372374280},{id:"d7",label:"아빠 차용금액",value:0}]},
  { month:"5월",  자산총계:2455109455, 부채총계:1745662994, 순자산:709446461,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:185109455}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:82600000},{id:"d5",label:"롯데캐피탈 신용대출",value:28170000},{id:"d6",label:"호반 주담대",value:371542994}]},
  { month:"6월",  자산총계:2454299894, 부채총계:1742721708, 순자산:711578186,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:184299894}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:82300000},{id:"d5",label:"롯데캐피탈 신용대출",value:26360000},{id:"d6",label:"호반 주담대",value:370711708}]},
  { month:"7월",  자산총계:2459839377, 부채총계:1739780422, 순자산:720058955,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:189839377}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:82000000},{id:"d5",label:"롯데캐피탈 신용대출",value:24550000},{id:"d6",label:"호반 주담대",value:369880422}]},
  { month:"8월",  자산총계:2464681586, 부채총계:1736819136, 순자산:727862450,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:194681586}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:81700000},{id:"d5",label:"롯데캐피탈 신용대출",value:22720000},{id:"d6",label:"호반 주담대",value:369049136}]},
  { month:"9월",  자산총계:2461250062, 부채총계:1733847850, 순자산:727402212,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:191250062}],
    debts:[{id:"d1",label:"전세보증금",value:900000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:283380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:81400000},{id:"d5",label:"롯데캐피탈 신용대출",value:20880000},{id:"d6",label:"호반 주담대",value:368217850}]},
  { month:"10월", 자산총계:3540771857, 부채총계:1730876564, 순자산:1809895293,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:2850000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:500000000},{id:"a3",label:"현금성 자산",note:"금융",value:190771857}],
    debts:[{id:"d1",label:"전세보증금",value:944000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:239380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:81100000},{id:"d5",label:"롯데캐피탈 신용대출",value:19040000},{id:"d6",label:"호반 주담대",value:367386564}]},
  { month:"11월", 자산총계:2462712535, 부채총계:1727885278, 순자산:734827257,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:1890000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:380000000},{id:"a3",label:"현금성 자산",note:"금융",value:192712535}],
    debts:[{id:"d1",label:"전세보증금",value:944000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:239380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:80800000},{id:"d5",label:"롯데캐피탈 신용대출",value:17180000},{id:"d6",label:"호반 주담대",value:366555278}]},
  { month:"12월", 자산총계:3422712535, 부채총계:1724883992, 순자산:1697828543,
    assets:[{id:"a1",label:"송파구 헬리오시티",note:"부동산",value:2750000000},{id:"a2",label:"영종 호반써밋",note:"부동산",value:480000000},{id:"a3",label:"현금성 자산",note:"금융",value:192712535}],
    debts:[{id:"d1",label:"전세보증금",value:944000000},{id:"d2",label:"하나 마통+주택청약담보대출",value:239380000},{id:"d3",label:"카카오 마통+신용+청약담보",value:79970000},{id:"d4",label:"새마을은행 신용대출",value:80500000},{id:"d5",label:"롯데캐피탈 신용대출",value:15310000},{id:"d6",label:"호반 주담대",value:365723992}]},
];

const M25_INC = [
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:12000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:10633630},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:0}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:12000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:7934550},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:0}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:12000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:7757130},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:0}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:21000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:4139600},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:1000000}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:13695970},{id:"i2",label:"현 월급(한화)",payer:"현",value:4000680},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:1225207}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:0},{id:"i2",label:"현 월급(한화)",payer:"현",value:4570580},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:569700}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:0},{id:"i2",label:"현 월급(한화)",payer:"현",value:14152250},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:10179100}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:2000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:4093150},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:120000}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:0},{id:"i2",label:"현 월급(한화)",payer:"현",value:4092950},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:0}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:3000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:3972950},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:3000000}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:3000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:3972950},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:3000000}],
  [{id:"i1",label:"혜정 월급",payer:"혜정",value:3000000},{id:"i2",label:"현 월급(한화)",payer:"현",value:0},{id:"i3",label:"현 월급(엔화)",payer:"현",value:0},{id:"i4",label:"호반 월세 수입",payer:"현",value:1350000},{id:"i5",label:"기타 수입",payer:"공통",value:3000000}],
];

const M25_EXP = [
  [{id:"e1",label:"아빠 대출이자",payer:"혜정",group:"대출이자",value:600000},{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:582433},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:14216},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:443205},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:601530},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2096458},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13810},{id:"e9",label:"아파트 관리비",payer:"현",group:"공과금",value:504560},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:49500},{id:"e11",label:"하이패스",payer:"현",group:"공과금",value:15000},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359859},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:349333},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e18",label:"혜정 오피스텔 월세",payer:"혜정",group:"공과금",value:1200000},{id:"e19",label:"혜정 오피스텔 관리비",payer:"혜정",group:"공과금",value:0},{id:"e20",label:"주유비",payer:"혜정",group:"공과금",value:116768},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:1500000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:1500000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:1611840},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:895320}],
  [{id:"e1",label:"아빠 대출이자",payer:"혜정",group:"대출이자",value:600000},{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:568845},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:14234},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:196185},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:600690},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2177119},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13810},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:49500},{id:"e11",label:"하이패스",payer:"현",group:"공과금",value:53800},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359793},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:349272},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e18",label:"혜정 오피스텔 월세",payer:"혜정",group:"공과금",value:1200000},{id:"e19",label:"혜정 오피스텔 관리비",payer:"혜정",group:"공과금",value:28470},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:1000000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:1000000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:895600},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:216080}],
  [{id:"e1",label:"아빠 대출이자",payer:"혜정",group:"대출이자",value:600000},{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:544976},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12856},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:175755},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:554660},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:1889445},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:12488},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:49500},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359339},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:405590},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e18",label:"혜정 오피스텔 월세",payer:"혜정",group:"공과금",value:1200000},{id:"e19",label:"혜정 오피스텔 관리비",payer:"혜정",group:"공과금",value:425000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:1000000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:1000000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:1817466},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:2442020}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:669069},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:14234},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:194586},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:573880},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2089929},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13826},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:49500},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359650},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:412997},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e19",label:"혜정 오피스텔 관리비",payer:"혜정",group:"공과금",value:1058710},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:1282627},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:1200000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:22518},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1228492}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:720554},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12493},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:188309},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:557530},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2046605},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13380},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359455},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:410105},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:300000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:300000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:2727614},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1766367}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:834484},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12909},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:194586},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:558480},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2084399},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13826},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359517},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:412334},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:300000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:300000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:994118},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1511691},{id:"e27",label:"자동차세",payer:"현",group:"비주기적",value:200000},{id:"e28",label:"QM3 보험료",payer:"현",group:"비주기적",value:624310},{id:"e29",label:"BMW 보험료",payer:"현",group:"비주기적",value:783360},{id:"e31",label:"호반 월세소득 종소세",payer:"현",group:"비주기적",value:384697}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:652714},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12493},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:188309},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:545370},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2041167},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13380},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:5819},{id:"e11",label:"하이패스",payer:"현",group:"공과금",value:50000},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359316},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e15",label:"QM3 월주차",payer:"현",group:"공과금",value:49000},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:409474},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:300000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:300000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:683303},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1818651},{id:"e25",label:"헬리오 재산세",payer:"혜정",group:"비주기적",value:2042670},{id:"e26",label:"호반 재산세",payer:"현",group:"비주기적",value:282970}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:661573},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12909},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:188794},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:552570},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2078961},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13826},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359363},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:411680},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:300000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:300000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:189416},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1046150}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:838377},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12909},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:200792},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:551640},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2075880},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13826},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359291},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:462534},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:500000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:900000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:598074},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:233980},{id:"e25",label:"헬리오 재산세",payer:"혜정",group:"비주기적",value:2042670},{id:"e26",label:"호반 재산세",payer:"현",group:"비주기적",value:282970}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:636831},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12493},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:215317},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:538980},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2033010},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13380},{id:"e11",label:"하이패스",payer:"현",group:"공과금",value:50000},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359113},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:460231},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:500000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:500000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:1096372},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:5011471}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:551082},{id:"e3",label:"주택청약담보대출(혜정)",payer:"혜정",group:"대출이자",value:12909},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:237161},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:539500},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2070442},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13826},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:359164},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e16",label:"혜정 학자금 대출",payer:"혜정",group:"공과금",value:461880},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:500000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:500000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:1096372},{id:"e24",label:"혜정 공비",payer:"혜정",group:"용돈/공비",value:1068151}],
  [{id:"e2",label:"하나 마통 이자",payer:"혜정",group:"대출이자",value:722074},{id:"e4",label:"카카오 마통 이자",payer:"현",group:"대출이자",value:26315},{id:"e5",label:"새마을 신용대출 이자",payer:"현",group:"대출이자",value:537190},{id:"e6",label:"호반 주담대 이자",payer:"현",group:"대출이자",value:2027572},{id:"e7",label:"롯데캐피탈 이자",payer:"현",group:"대출이자",value:1961302},{id:"e8",label:"주택청약담보대출(현)",payer:"현",group:"대출이자",value:13380},{id:"e10",label:"인터넷 요금",payer:"현",group:"공과금",value:3089},{id:"e11",label:"하이패스",payer:"현",group:"공과금",value:50000},{id:"e12",label:"QM3/유심",payer:"현",group:"공과금",value:2510},{id:"e13",label:"현 학자금 대출",payer:"현",group:"공과금",value:358969},{id:"e14",label:"안마의자 할부금",payer:"현",group:"공과금",value:49900},{id:"e17",label:"혜정 하나적금",payer:"혜정",group:"공과금",value:100000},{id:"e21",label:"혜정 용돈",payer:"혜정",group:"용돈/공비",value:500000},{id:"e22",label:"현 용돈",payer:"현",group:"용돈/공비",value:500000},{id:"e23",label:"현 공비",payer:"현",group:"용돈/공비",value:6504501},{id:"e30",label:"종합부동산세",payer:"혜정",group:"비주기적",value:457530}],
];

// ── 유틸 ──────────────────────────────────────────────────────
const nv = v => Number(String(v||0).replace(/[^0-9.-]/g,""))||0;
const fmtW = n => {
  if(!n && n!==0) return "-";
  const abs=Math.abs(n), sign=n<0?"-":"";
  if(abs>=1e8) return sign+(abs/1e8).toFixed(1)+"억";
  if(abs>=1e4) return sign+Math.round(abs/1e4)+"만";
  return n.toLocaleString("ko-KR")+"원";
};
const fmtFull = n => (!n&&n!==0)?"-":n.toLocaleString("ko-KR")+"원";
const tf = v => Math.abs(v)>=1e8?(v/1e8).toFixed(0)+"억":(v/1e6).toFixed(0)+"M";
const uid = () => Math.random().toString(36).slice(2,8);
const makeEmptyBalance = () => MONTHS.map(m=>({month:m,assets:[],debts:[],자산총계:0,부채총계:0,순자산:0}));
const makeEmptyInc = () => Array(12).fill(null).map(()=>[]);
const makeEmptyExp = () => Array(12).fill(null).map(()=>[]);
const makeEmptyGongbi = () => Array(12).fill(null).map(()=>({혜정:[], 현:[]}));

// ── 공통 컴포넌트 ─────────────────────────────────────────────
const TT = ({active,payload,label}) => {
  if(!active||!payload?.length) return null;
  return <div style={{background:"rgba(8,8,18,.97)",border:"1px solid #2a2a3a",borderRadius:10,padding:"10px 14px",fontSize:12}}>
    <div style={{color:"#7070b0",marginBottom:6,fontWeight:700}}>{label}</div>
    {payload.map((p,i)=><div key={i} style={{color:p.color,marginBottom:2}}>{p.name}: <span style={{color:"#fff",fontWeight:600}}>{fmtW(p.value)}</span></div>)}
  </div>;
};
const TB = ({label,active,onClick}) => <button onClick={onClick} style={{padding:"6px 14px",borderRadius:18,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,background:active?"linear-gradient(135deg,#6c63ff,#4ecdc4)":"rgba(255,255,255,0.06)",color:active?"#fff":"#5560a0",whiteSpace:"nowrap"}}>{label}</button>;
const Card = ({children,style}) => <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:18,...style}}>{children}</div>;
const CT = ({children,style}) => <div style={{fontSize:11,fontWeight:700,color:"#5560a0",textTransform:"uppercase",letterSpacing:1,marginBottom:14,...style}}>{children}</div>;
const KPI = ({title,value,sub,color}) => <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 18px",flex:1,minWidth:110}}>
  <div style={{fontSize:9,fontWeight:700,color:"#4040a0",textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>{title}</div>
  <div style={{color:color||"#fff",fontSize:16,fontWeight:800,lineHeight:1.2}}>{value}</div>
  {sub&&<div style={{color:"#4040a0",fontSize:10,marginTop:4}}>{sub}</div>}
</div>;

// ── 인라인 편집 행 ────────────────────────────────────────────
// 클릭하면 이름/금액 모두 인라인 편집, 삭제 버튼
function EditableRow({item, onSave, onDelete, valueLabel="금액", showPayer=false, payerColor}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [value, setValue] = useState(String(item.value??item.amount??0));
  const [payer, setPayer] = useState(item.payer||"공통");
  const [memo, setMemo] = useState(item.memo||"");

  const commit = () => {
    onSave({...item, label, value: nv(value), amount: nv(value), payer, memo: memo.trim()});
    setEditing(false);
  };
  const cancel = () => {
    setLabel(item.label); setValue(String(item.value??item.amount??0));
    setPayer(item.payer||"공통"); setMemo(item.memo||"");
    setEditing(false);
  };

  if(editing) return (
    <div style={{padding:"10px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(108,99,255,0.05)",borderRadius:8,marginBottom:2}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
        <input value={label} onChange={e=>setLabel(e.target.value)} autoFocus placeholder="항목명"
          style={{flex:"2 1 100px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(108,99,255,0.5)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,outline:"none"}}/>
        {showPayer && <select value={payer} onChange={e=>setPayer(e.target.value)}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(108,99,255,0.3)",borderRadius:7,color:"#fff",padding:"5px 7px",fontSize:11,outline:"none"}}>
          <option value="혜정">혜정</option><option value="현">현</option><option value="공통">공통</option>
        </select>}
        <input value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,""))} placeholder="금액"
          style={{flex:"1 1 80px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(107,203,119,0.4)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,textAlign:"right",outline:"none"}}/>
      </div>
      <div style={{marginBottom:6}}>
        <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="📝 비고 (선택 사항)"
          style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#b0b8d0",padding:"5px 10px",fontSize:11,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={commit} style={{padding:"5px 14px",borderRadius:7,border:"none",background:"#6c63ff",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}}>✓ 저장</button>
        <button onClick={cancel} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#5060a0",fontSize:11,cursor:"pointer"}}>취소</button>
        <button onClick={onDelete} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,70,70,0.3)",background:"rgba(255,70,70,0.08)",color:"#ff7070",fontSize:11,cursor:"pointer",marginLeft:"auto"}}>삭제</button>
      </div>
    </div>
  );

  const val = item.value ?? item.amount ?? 0;
  const pc = C[item.payer] || "#aaa";
  return (
    <div onClick={()=>setEditing(true)} style={{padding:"8px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",borderRadius:6,transition:"background .1s"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:12,color:"#d0d0f0"}}>{item.label}</span>
          {showPayer && item.payer && <span style={{marginLeft:6,fontSize:9,color:pc,background:`${pc}18`,borderRadius:4,padding:"1px 5px"}}>{item.payer}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,paddingLeft:8}}>
          <span style={{color:payerColor||"#d0d0f0",fontWeight:600,fontSize:12}}>{fmtFull(val)}</span>
          <span style={{color:"#3040a0",fontSize:10}}>✎</span>
        </div>
      </div>
      {item.memo && (
        <div style={{marginTop:3,display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:10,color:"#404878"}}>📝</span>
          <span style={{fontSize:10,color:"#5868a0"}}>{item.memo}</span>
        </div>
      )}
    </div>
  );
}

// 새 항목 추가 행
function AddRow({onAdd, groups, showPayer=false}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [payer, setPayer] = useState("혜정");
  const [group, setGroup] = useState(groups?.[0]||"");
  const [memo, setMemo] = useState("");

  const commit = () => {
    if(!label) return;
    onAdd({id:uid(), label, value:nv(value), amount:nv(value), payer, group, memo:memo.trim()});
    setLabel(""); setValue(""); setMemo(""); setOpen(false);
  };

  if(!open) return <button onClick={()=>setOpen(true)} style={{width:"100%",padding:"7px",borderRadius:8,border:"1px dashed rgba(108,99,255,0.3)",background:"transparent",color:"#5060b0",fontSize:11,cursor:"pointer",marginTop:8}}>+ 항목 추가</button>;
  return (
    <div style={{marginTop:8,padding:"10px 8px",borderRadius:8,background:"rgba(108,99,255,0.05)",border:"1px solid rgba(108,99,255,0.15)"}}>
      <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:6}}>
        <input value={label} onChange={e=>setLabel(e.target.value)} autoFocus placeholder="항목명"
          style={{flex:2,minWidth:100,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(108,99,255,0.5)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,outline:"none"}}/>
        {showPayer && <select value={payer} onChange={e=>setPayer(e.target.value)}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(108,99,255,0.3)",borderRadius:7,color:"#fff",padding:"5px 7px",fontSize:11,outline:"none"}}>
          <option value="혜정">혜정</option><option value="현">현</option><option value="공통">공통</option>
        </select>}
        {groups && <select value={group} onChange={e=>setGroup(e.target.value)}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(108,99,255,0.3)",borderRadius:7,color:"#fff",padding:"5px 7px",fontSize:11,outline:"none"}}>
          {groups.map(g=><option key={g} value={g}>{g}</option>)}
        </select>}
        <input value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,""))} placeholder="금액"
          style={{flex:1,minWidth:80,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(107,203,119,0.4)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,textAlign:"right",outline:"none"}}/>
      </div>
      <div style={{marginBottom:6}}>
        <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="📝 비고 (선택 사항)"
          style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#b0b8d0",padding:"5px 10px",fontSize:11,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={commit} style={{padding:"4px 10px",borderRadius:7,border:"none",background:"#6c63ff",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}}>추가</button>
        <button onClick={()=>{setOpen(false);setMemo("");}} style={{padding:"4px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#5060a0",fontSize:11,cursor:"pointer"}}>취소</button>
      </div>
    </div>
  );
}


// ── 종합 현황 탭 ──────────────────────────────────────────────
function OverviewTab({yearData, balanceData, prevYearNW}) {
  const annualInc = useMemo(()=>yearData.inc.reduce((s,m)=>s+m.reduce((ss,i)=>ss+(i.value||0),0),0),[yearData]);
  const annualExp = useMemo(()=>yearData.exp.reduce((s,m)=>s+m.reduce((ss,i)=>ss+(i.value||0),0),0),[yearData]);
  const latest = balanceData.filter(b=>b.순자산>0).slice(-1)[0]||{순자산:0};
  const nwGrowth = latest.순자산-(prevYearNW||0);
  const chart = yearData.inc.map((m,i)=>({
    month:MONTHS[i],
    수입:m.reduce((s,x)=>s+(x.value||0),0),
    지출:yearData.exp[i].reduce((s,x)=>s+(x.value||0),0),
  }));
  return <div>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:14}}>
      <KPI title="연간 총 수입" value={fmtW(annualInc)} color={C.수입}/>
      <KPI title="연간 총 지출" value={fmtW(annualExp)} color={C.지출}/>
      <KPI title="최신 순자산" value={fmtW(latest.순자산)} color={C.순자산} sub={prevYearNW?`전년 대비 ${nwGrowth>=0?"+":""}${fmtW(nwGrowth)}`:""}/>
    </div>
    <Card style={{marginBottom:14}}><CT>📈 순자산 추이</CT>
      <ResponsiveContainer width="100%" height={190}><LineChart data={balanceData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
        <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
        <Tooltip content={<TT/>}/><Legend wrapperStyle={{color:"#6060a0",fontSize:11}}/>
        <Line dataKey="순자산" name="순자산" stroke={C.순자산} strokeWidth={2.5} dot={{r:3}}/>
        <Line dataKey="부채총계" name="부채총계" stroke={C.부채} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
      </LineChart></ResponsiveContainer>
    </Card>
    <Card><CT>💸 월별 수입·지출</CT>
      <ResponsiveContainer width="100%" height={170}><BarChart data={chart} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
        <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
        <Tooltip content={<TT/>}/><Legend wrapperStyle={{color:"#6060a0",fontSize:11}}/>
        <Bar dataKey="수입" fill={C.수입} radius={[3,3,0,0]}/><Bar dataKey="지출" fill={C.지출} radius={[3,3,0,0]}/>
      </BarChart></ResponsiveContainer>
    </Card>
  </div>;
}

// ── 수입/지출 탭 ──────────────────────────────────────────────
function IncExpTab({yearData, onUpdateInc, onUpdateExp, years, selYear, yearList}) {
  const [sel, setSel] = useState(0);
  const [view, setView] = useState("summary");
  const [cpConf, setCpConf] = useState(false);
  const incItems = yearData.inc[sel] || [];
  const expItems = yearData.exp[sel] || [];
  const getPrevIE = () => {
    if (sel > 0) return {inc: yearData.inc[sel-1], exp: yearData.exp[sel-1]};
    const py = yearList.filter(y=>y<selYear).slice(-1)[0];
    return (py && years[py]) ? {inc: years[py].inc[11], exp: years[py].exp[11]} : null;
  };
  const prevIELabel = (() => {
    if (sel > 0) return MONTHS[sel-1];
    const py = yearList.filter(y=>y<selYear).slice(-1)[0];
    return py ? py+"년 12월" : null;
  })();
  const doCopyIE = () => {
    if (!cpConf) { setCpConf(true); setTimeout(()=>setCpConf(false),3000); return; }
    const prev = getPrevIE(); if (!prev) return;
    onUpdateInc(sel, prev.inc.map(x=>({...x,id:Math.random().toString(36).slice(2)})));
    onUpdateExp(sel, prev.exp.map(x=>({...x,id:Math.random().toString(36).slice(2)})));
    setCpConf(false);
  };
  const totalInc = useMemo(()=>incItems.reduce((s,i)=>s+(i.value||0),0),[incItems]);
  const totalExp = useMemo(()=>expItems.reduce((s,i)=>s+(i.value||0),0),[expItems]);
  const bal = totalInc - totalExp;

  const grpTotals = useMemo(()=>{
    const g={};
    expItems.forEach(i=>{g[i.group]=(g[i.group]||0)+(i.value||0);});
    return g;
  },[expItems]);
  const payerTotals = useMemo(()=>{
    const p={혜정:0,현:0,공통:0};
    expItems.forEach(i=>{p[i.payer]=(p[i.payer]||0)+(i.value||0);});
    return p;
  },[expItems]);

  const annualChart = yearData.inc.map((m,i)=>{
    const inc=m.reduce((s,x)=>s+(x.value||0),0);
    const exp=yearData.exp[i].reduce((s,x)=>s+(x.value||0),0);
    return {month:MONTHS[i],수입:inc,지출:exp,잔액:inc-exp};
  });
  const pieData = Object.entries(grpTotals).filter(([,v])=>v>0).map(([k,v])=>({name:k,value:v}));

  const saveInc = (idx, updated) => onUpdateInc(sel, incItems.map((x,i)=>i===idx?updated:x));
  const deleteInc = idx => onUpdateInc(sel, incItems.filter((_,i)=>i!==idx));
  const addInc = item => onUpdateInc(sel, [...incItems, item]);
  const saveExp = (idx, updated) => onUpdateExp(sel, expItems.map((x,i)=>i===idx?updated:x));
  const deleteExp = idx => onUpdateExp(sel, expItems.filter((_,i)=>i!==idx));
  const addExp = item => onUpdateExp(sel, [...expItems, item]);

  const expGroups = Object.keys(GC);

  return <div>
    <Card style={{marginBottom:11}}><CT>📅 연간 수입·지출</CT>
      <ResponsiveContainer width="100%" height={150}><BarChart data={annualChart} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
        <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
        <Tooltip content={<TT/>}/><Legend wrapperStyle={{color:"#6060a0",fontSize:11}}/>
        <Bar dataKey="수입" fill={C.수입} radius={[3,3,0,0]}/><Bar dataKey="지출" fill={C.지출} radius={[3,3,0,0]}/>
      </BarChart></ResponsiveContainer>
    </Card>
    <Card style={{marginBottom:11}}><CT>💰 월별 잔액</CT>
      <ResponsiveContainer width="100%" height={100}><LineChart data={annualChart}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
        <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
        <Tooltip content={<TT/>}/><ReferenceLine y={0} stroke="rgba(255,255,255,0.15)"/>
        <Line dataKey="잔액" name="잔액" stroke={C.accent} strokeWidth={2} dot={{r:3}}/>
      </LineChart></ResponsiveContainer>
    </Card>

    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
      {MONTHS.map((m,i)=><TB key={i} label={m} active={sel===i} onClick={()=>{setSel(i);setCpConf(false);}}/>)}
    </div>
    {prevIELabel && <div style={{marginBottom:10}}><button onClick={doCopyIE} style={{padding:"7px 18px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .2s",background:cpConf?"linear-gradient(135deg,#ff5555,#cc1111)":"rgba(108,99,255,0.13)",color:cpConf?"#fff":"#a78bfa",border:cpConf?"1px solid rgba(255,80,80,0.7)":"1px solid rgba(108,99,255,0.4)"}}>{cpConf?"⚠️ 한 번 더 누르면 "+prevIELabel+" 항목으로 덮어씁니다":"📋 "+prevIELabel+" 항목 그대로 불러오기"}</button></div>}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
      <KPI title="총 수입" value={fmtW(totalInc)} color={C.수입}/>
      <KPI title="총 지출" value={fmtW(totalExp)} color={C.지출}/>
      <KPI title="잔액" value={fmtW(bal)} color={bal>=0?C.수입:C.지출} sub={bal>=0?"흑자":"적자"}/>
    </div>

    <div style={{display:"flex",gap:7,marginBottom:12}}>
      <TB label="📊 요약" active={view==="summary"} onClick={()=>setView("summary")}/>
      <TB label="📋 상세" active={view==="detail"} onClick={()=>setView("detail")}/>
    </div>

    {view==="summary" && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
      <Card>
        <CT>지출 구성</CT>
        {pieData.length>0
          ?<ResponsiveContainer width="100%" height={145}><PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={55}
                label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                {pieData.map((_,i)=><Cell key={i} fill={GCOLS[i%4]}/>)}
              </Pie>
              <Tooltip formatter={v=>fmtFull(v)}/>
            </PieChart></ResponsiveContainer>
          :<div style={{color:"#3030a0",textAlign:"center",padding:40,fontSize:12}}>데이터 없음</div>}
      </Card>
      <Card>
        <CT>부담 주체</CT>
        {["혜정","현"].map(p=><div key={p} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <span style={{color:C[p],fontWeight:700,fontSize:12}}>{p}</span>
            <span style={{color:"#fff",fontSize:12,fontWeight:600}}>{fmtW(payerTotals[p])}</span>
          </div>
          <div style={{height:5,borderRadius:5,background:"rgba(255,255,255,0.07)",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${totalExp>0?Math.round(payerTotals[p]/totalExp*100):0}%`,background:`linear-gradient(90deg,${C[p]}50,${C[p]})`,borderRadius:5}}/>
          </div>
          <div style={{color:"#3040a0",fontSize:9,marginTop:2}}>{totalExp>0?Math.round(payerTotals[p]/totalExp*100):0}%</div>
        </div>)}
      </Card>
      {Object.entries(grpTotals).map(([g,t])=><Card key={g}>
        <div style={{fontSize:10,fontWeight:700,color:GC[g],textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{g}</div>
        <div style={{fontSize:18,fontWeight:800,color:GC[g]}}>{fmtW(t)}</div>
        <div style={{color:"#3040a0",fontSize:10,marginTop:3}}>지출 대비 {totalExp>0?Math.round(t/totalExp*100):0}%</div>
      </Card>)}
    </div>}

    {view==="detail" && <div>
      <Card style={{marginBottom:10}}>
        <CT style={{color:"#6bcb77"}}>💚 수입</CT>
        {incItems.map((item,idx)=><EditableRow key={item.id||idx} item={item} showPayer
          payerColor={C.수입}
          onSave={updated=>saveInc(idx,updated)}
          onDelete={()=>deleteInc(idx)}/>)}
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 6px 0",fontWeight:800,color:"#6bcb77",fontSize:14,borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:4}}>
          <span>합계</span><span>{fmtFull(totalInc)}</span>
        </div>
        <AddRow onAdd={addInc} showPayer/>
      </Card>

      {expGroups.map(grp=>{
        const items = expItems.filter(i=>i.group===grp);
        const gt = items.reduce((s,i)=>s+(i.value||0),0);
        return <Card key={grp} style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:GC[grp],textTransform:"uppercase",letterSpacing:1}}>{grp}</div>
            <div style={{fontSize:13,fontWeight:700,color:GC[grp]}}>{fmtW(gt)}</div>
          </div>
          {items.map((item,localIdx)=>{
            const idx = expItems.findIndex(x=>x===item);
            return <EditableRow key={item.id||idx} item={item} showPayer
              payerColor={GC[grp]}
              onSave={updated=>saveExp(idx,updated)}
              onDelete={()=>deleteExp(idx)}/>;
          })}
          <AddRow onAdd={item=>addExp({...item,group:grp})} showPayer groups={expGroups}/>
        </Card>;
      })}

      {/* 기존 항목 중 group 없는 것 대비 */}
      {expItems.filter(i=>!expGroups.includes(i.group)).length>0 && <Card style={{marginBottom:10}}>
        <CT>기타</CT>
        {expItems.filter(i=>!expGroups.includes(i.group)).map((item,localIdx)=>{
          const idx = expItems.findIndex(x=>x===item);
          return <EditableRow key={item.id||idx} item={item} showPayer
            onSave={updated=>saveExp(idx,updated)} onDelete={()=>deleteExp(idx)}/>;
        })}
      </Card>}
    </div>}
  </div>;
}

// ── 대차대조표 탭 ─────────────────────────────────────────────
function BalanceTab({balanceMonths, onUpdate, years, selYear, yearList}) {
  const [sel, setSel] = useState(0);
  const [cpConfB, setCpConfB] = useState(false);
  const mb = balanceMonths?.[sel] || {month:MONTHS[sel],assets:[],debts:[],자산총계:0,부채총계:0,순자산:0};
  const prevNW = sel>0 ? (balanceMonths?.[sel-1]?.순자산||0) : (balanceMonths?.[11]?.순자산||0);
  const nwDiff = (mb.순자산||0) - prevNW;
  const getPrevBal = () => {
    if (sel > 0) return balanceMonths[sel-1];
    const py = yearList.filter(y=>y<selYear).slice(-1)[0];
    return (py && years[py]) ? years[py].balance[11] : null;
  };
  const prevBalLabel = (() => {
    if (sel > 0) return MONTHS[sel-1];
    const py = yearList.filter(y=>y<selYear).slice(-1)[0];
    return py ? py+"년 12월" : null;
  })();
  const doCopyBal = () => {
    if (!cpConfB) { setCpConfB(true); setTimeout(()=>setCpConfB(false),3000); return; }
    const prev = getPrevBal(); if (!prev) return;
    const assets=prev.assets.map(x=>({...x,id:Math.random().toString(36).slice(2)}));
    const debts=prev.debts.map(x=>({...x,id:Math.random().toString(36).slice(2)}));
    const at=assets.reduce((s,x)=>s+(x.value||0),0), dt=debts.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel,{...mb,assets,debts,자산총계:at,부채총계:dt,순자산:at-dt});
    setCpConfB(false);
  };

  const saveAsset = (idx, updated) => {
    const assets = mb.assets.map((x,i)=>i===idx?updated:x);
    const 자산총계 = assets.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, assets, 자산총계, 순자산: 자산총계-mb.부채총계});
  };
  const deleteAsset = idx => {
    const assets = mb.assets.filter((_,i)=>i!==idx);
    const 자산총계 = assets.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, assets, 자산총계, 순자산: 자산총계-mb.부채총계});
  };
  const addAsset = item => {
    const assets = [...mb.assets, item];
    const 자산총계 = assets.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, assets, 자산총계, 순자산: 자산총계-mb.부채총계});
  };

  const saveDebt = (idx, updated) => {
    const debts = mb.debts.map((x,i)=>i===idx?updated:x);
    const 부채총계 = debts.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, debts, 부채총계, 순자산: mb.자산총계-부채총계});
  };
  const deleteDebt = idx => {
    const debts = mb.debts.filter((_,i)=>i!==idx);
    const 부채총계 = debts.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, debts, 부채총계, 순자산: mb.자산총계-부채총계});
  };
  const addDebt = item => {
    const debts = [...mb.debts, item];
    const 부채총계 = debts.reduce((s,x)=>s+(x.value||0),0);
    onUpdate(sel, {...mb, debts, 부채총계, 순자산: mb.자산총계-부채총계});
  };

  return <div>
    <Card style={{marginBottom:14}}><CT>📈 순자산 추이</CT>
      <ResponsiveContainer width="100%" height={190}><LineChart data={balanceMonths}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
        <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
        <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
        <Tooltip content={<TT/>}/><Legend wrapperStyle={{color:"#6060a0",fontSize:11}}/>
        <Line dataKey="순자산" name="순자산" stroke={C.순자산} strokeWidth={2.5} dot={{r:3}}/>
        <Line dataKey="부채총계" name="부채총계" stroke={C.부채} strokeWidth={1.5} strokeDasharray="4 2" dot={false}/>
      </LineChart></ResponsiveContainer>
    </Card>

    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
      {MONTHS.map((m,i)=><TB key={i} label={m} active={sel===i} onClick={()=>{setSel(i);setCpConfB(false);}}/>)}
    </div>
    {prevBalLabel && <div style={{marginBottom:10}}>
      <button onClick={doCopyBal} style={{padding:"7px 18px",borderRadius:20,cursor:"pointer",fontSize:12,fontWeight:700,transition:"all .2s",
        background:cpConfB?"linear-gradient(135deg,#ff5555,#cc1111)":"rgba(249,202,36,0.12)",
        color:cpConfB?"#fff":"#f9ca24",
        border:cpConfB?"1px solid rgba(255,80,80,0.7)":"1px solid rgba(249,202,36,0.35)"}}>
        {cpConfB?"⚠️ 한 번 더 누르면 "+prevBalLabel+" 항목으로 덮어씁니다":"📋 "+prevBalLabel+" 항목 그대로 불러오기"}
      </button>
    </div>}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
      <KPI title="자산 총계" value={fmtW(mb.자산총계)} color={C.accent}/>
      <KPI title="부채 총계" value={fmtW(mb.부채총계)} color={C.부채}/>
      <KPI title="순자산" value={fmtW(mb.순자산)} color={C.순자산} sub={`전월 ${nwDiff>=0?"▲":"▼"} ${fmtW(Math.abs(nwDiff))}`}/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <Card style={{border:"1px solid rgba(167,139,250,0.2)"}}>
        <CT style={{color:"#a78bfa"}}>🏠 자산</CT>
        {mb.assets.map((item,idx)=><EditableRow key={item.id||idx} item={item}
          payerColor="#a78bfa"
          onSave={updated=>saveAsset(idx,updated)}
          onDelete={()=>deleteAsset(idx)}/>)}
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 6px 0",fontWeight:800,color:"#a78bfa",fontSize:13,borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:4}}>
          <span>자산 총계</span><span>{fmtFull(mb.자산총계)}</span>
        </div>
        <AddRow onAdd={addAsset}/>
      </Card>
      <Card style={{border:"1px solid rgba(255,112,112,0.2)"}}>
        <CT style={{color:"#ff7070"}}>💳 부채</CT>
        {mb.debts.map((item,idx)=><EditableRow key={item.id||idx} item={item}
          payerColor="#ff7070"
          onSave={updated=>saveDebt(idx,updated)}
          onDelete={()=>deleteDebt(idx)}/>)}
        <div style={{display:"flex",justifyContent:"space-between",padding:"9px 6px 0",fontWeight:800,color:"#ff7070",fontSize:13,borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:4}}>
          <span>부채 총계</span><span>{fmtFull(mb.부채총계)}</span>
        </div>
        <AddRow onAdd={addDebt}/>
      </Card>
    </div>

    <div style={{background:"linear-gradient(135deg,rgba(249,202,36,.1),rgba(249,202,36,.03))",border:"1px solid rgba(249,202,36,0.22)",borderRadius:14,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{color:"#f9ca24",fontWeight:800,fontSize:17}}>순자산 {fmtFull(mb.순자산)}</div>
        <div style={{color:"#4040a0",fontSize:10,marginTop:2}}>자산 총계 − 부채 총계</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{color:nwDiff>=0?"#4ecdc4":"#ff7070",fontSize:14,fontWeight:700}}>{nwDiff>=0?"▲":"▼"} {fmtW(Math.abs(nwDiff))}</div>
        <div style={{color:"#4040a0",fontSize:10}}>전월 대비</div>
      </div>
    </div>
  </div>;
}

// ── 공비 탭 ──────────────────────────────────────────────────
// ── 공비 탭 ──────────────────────────────────────────────────
function GongbiTab({gongbiData, onUpdate}) {
  const [sel, setSel] = useState(0);
  const [threshold, setThreshold] = useState(50000);
  const [thresholdInput, setThresholdInput] = useState("50000");
  const [editingThreshold, setEditingThreshold] = useState(false);

  // 전체 데이터에서 자동완성용 항목명 수집 (중복 제거)
  const allLabels = useMemo(() => {
    const set = new Set();
    gongbiData.forEach(m => {
      ["혜정","현"].forEach(p => {
        (m[p]||[]).forEach(x => { if(x.label) set.add(x.label); });
      });
    });
    return Array.from(set);
  }, [gongbiData]);

  const monthData = gongbiData[sel] || {혜정:[], 현:[]};
  const PERSONS = ["혜정", "현"];
  const PC = {혜정: C.혜정, 현: C.현};

  const totalBy = (person) => (monthData[person]||[]).reduce((s,x)=>s+(x.value||0),0);
  const grandTotal = PERSONS.reduce((s,p)=>s+totalBy(p),0);

  const annualData = gongbiData.map((m,i)=>({
    month: MONTHS[i],
    혜정: (m.혜정||[]).reduce((s,x)=>s+(x.value||0),0),
    현:   (m.현||[]).reduce((s,x)=>s+(x.value||0),0),
  }));

  const commitThreshold = () => {
    const v = parseInt(thresholdInput.replace(/,/g,""));
    if(!isNaN(v) && v >= 0) setThreshold(v);
    setEditingThreshold(false);
  };

  return <div>
    <Card style={{marginBottom:11}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <CT style={{marginBottom:0}}>📦 월별 공비 현황</CT>
        {/* 임계금액 설정 */}
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:10,color:"#5060a0",whiteSpace:"nowrap"}}>🔔 강조 기준</span>
          {editingThreshold
            ? <div style={{display:"flex",gap:4,alignItems:"center"}}>
                <input autoFocus value={thresholdInput}
                  onChange={e=>setThresholdInput(e.target.value.replace(/[^0-9]/g,""))}
                  onKeyDown={e=>{if(e.key==="Enter")commitThreshold(); if(e.key==="Escape")setEditingThreshold(false);}}
                  style={{width:80,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,202,36,0.5)",borderRadius:6,color:"#f9ca24",padding:"3px 7px",fontSize:11,outline:"none",textAlign:"right"}}/>
                <button onClick={commitThreshold} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"#6c63ff",color:"#fff",fontSize:10,cursor:"pointer",fontWeight:700}}>설정</button>
                <button onClick={()=>setEditingThreshold(false)} style={{padding:"3px 6px",borderRadius:6,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#5060a0",fontSize:10,cursor:"pointer"}}>✕</button>
              </div>
            : <button onClick={()=>{setThresholdInput(String(threshold));setEditingThreshold(true);}}
                style={{padding:"3px 10px",borderRadius:12,border:"1px solid rgba(255,202,36,0.35)",background:"rgba(255,202,36,0.08)",color:"#f9ca24",fontSize:11,cursor:"pointer",fontWeight:600}}>
                {threshold===0 ? "설정 없음" : fmtW(threshold)+" 이상"}
              </button>
          }
        </div>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={annualData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
          <XAxis dataKey="month" tick={{fill:"#4040a0",fontSize:10}}/>
          <YAxis tickFormatter={tf} tick={{fill:"#4040a0",fontSize:9}} width={44}/>
          <Tooltip content={<TT/>}/>
          <Legend wrapperStyle={{color:"#6060a0",fontSize:11}}/>
          <Bar dataKey="혜정" fill={C.혜정} radius={[3,3,0,0]}/>
          <Bar dataKey="현"   fill={C.현}   radius={[3,3,0,0]}/>
        </BarChart>
      </ResponsiveContainer>
    </Card>

    <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:12}}>
      {MONTHS.map((m,i)=><TB key={i} label={m} active={sel===i} onClick={()=>setSel(i)}/>)}
    </div>

    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
      {PERSONS.map(p=><KPI key={p} title={p+" 공비"} value={fmtW(totalBy(p))} color={PC[p]}/>)}
      <KPI title="합계" value={fmtW(grandTotal)} color="#f9ca24"/>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {PERSONS.map(person => {
        const items = monthData[person] || [];
        const total = items.reduce((s,x)=>s+(x.value||0),0);
        const color = PC[person];
        const saveItem   = (idx, updated) => onUpdate(sel, person, items.map((x,i)=>i===idx?updated:x));
        const deleteItem = (idx)           => onUpdate(sel, person, items.filter((_,i)=>i!==idx));
        const addItem    = (item)          => onUpdate(sel, person, [...items, item]);
        return <Card key={person} style={{border:`1px solid ${color}30`}}>
          <CT style={{color}}>{person==="혜정"?"🌸":"🌿"} {person} 공비</CT>
          {items.map((item,idx)=>(
            <GongbiRow key={item.id||idx} item={item} color={color} threshold={threshold}
              onSave={updated=>saveItem(idx,updated)}
              onDelete={()=>deleteItem(idx)}/>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 6px 0",fontWeight:800,color,fontSize:13,borderTop:"1px solid rgba(255,255,255,0.06)",marginTop:4}}>
            <span>합계</span><span>{fmtFull(total)}</span>
          </div>
          <GongbiAddRow color={color} allLabels={allLabels} onAdd={addItem}/>
        </Card>;
      })}
    </div>
  </div>;
}

// 임계금액 배경색 계산
function thresholdBg(value, threshold) {
  if (!threshold || value < threshold) return null;
  // 초과 비율에 따라 강도 조절 (최대 3배까지)
  const ratio = Math.min((value - threshold) / threshold, 2);
  const alpha = 0.18 + ratio * 0.18;
  return {
    background: `rgba(255, 140, 50, ${alpha})`,
    border: `1px solid rgba(255, 140, 50, ${0.4 + ratio * 0.2})`,
    borderRadius: 5,
    padding: "1px 6px",
  };
}

function GongbiRow({item, onSave, onDelete, color, threshold}) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel]     = useState(item.label);
  const [value, setValue]     = useState(String(item.value||0));
  const [memo, setMemo]       = useState(item.memo||"");

  const commit = () => {
    onSave({...item, label, value:nv(value), memo:memo.trim()});
    setEditing(false);
  };
  const cancel = () => {
    setLabel(item.label); setValue(String(item.value||0)); setMemo(item.memo||"");
    setEditing(false);
  };

  if(editing) return (
    <div style={{padding:"10px 8px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(108,99,255,0.05)",borderRadius:8,marginBottom:2}}>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
        <input value={label} onChange={e=>setLabel(e.target.value)} autoFocus placeholder="항목명"
          style={{flex:2,background:"rgba(255,255,255,0.08)",border:`1px solid ${color}80`,borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,outline:"none"}}/>
        <input value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,""))} placeholder="금액"
          style={{flex:1,minWidth:70,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(107,203,119,0.4)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,textAlign:"right",outline:"none"}}/>
      </div>
      <div style={{marginBottom:6}}>
        <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="📝 비고 (선택 사항)"
          style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#b0b8d0",padding:"5px 10px",fontSize:11,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={commit} style={{padding:"5px 14px",borderRadius:7,border:"none",background:"#6c63ff",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}}>✓ 저장</button>
        <button onClick={cancel} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#5060a0",fontSize:11,cursor:"pointer"}}>취소</button>
        <button onClick={onDelete} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,70,70,0.3)",background:"rgba(255,70,70,0.08)",color:"#ff7070",fontSize:11,cursor:"pointer",marginLeft:"auto"}}>삭제</button>
      </div>
    </div>
  );

  const isHigh   = threshold > 0 && (item.value||0) >= threshold;
  const hlStyle  = isHigh ? thresholdBg(item.value||0, threshold) : {};

  return (
    <div onClick={()=>setEditing(true)}
      style={{padding:"7px 6px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",borderRadius:6,transition:"background .1s"}}
      onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:"#d0d0f0",flex:1,minWidth:0,...(isHigh?{fontWeight:700}:{})}}>{item.label}</span>
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,paddingLeft:8}}>
          <span style={{color:isHigh?"#ff8c32":color,fontWeight:isHigh?800:600,fontSize:12,...hlStyle}}>
            {fmtFull(item.value||0)}
          </span>
          <span style={{color:"#3040a0",fontSize:10}}>✎</span>
        </div>
      </div>
      {item.memo && <div style={{marginTop:3,display:"flex",alignItems:"center",gap:4}}>
        <span style={{fontSize:10,color:"#404878"}}>📝</span>
        <span style={{fontSize:10,color:"#5868a0"}}>{item.memo}</span>
      </div>}
    </div>
  );
}

function GongbiAddRow({onAdd, color, allLabels}) {
  const [open, setOpen]   = useState(false);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [memo, setMemo]   = useState("");
  const [showAC, setShowAC] = useState(false);
  const inputRef = useRef(null);

  const suggestions = useMemo(() => {
    if(!label.trim()) return [];
    const q = label.trim().toLowerCase();
    return allLabels.filter(l => l.toLowerCase().includes(q) && l !== label).slice(0, 6);
  }, [label, allLabels]);

  const commit = () => {
    if(!label) return;
    onAdd({id:uid(), label, value:nv(value), memo:memo.trim()});
    setLabel(""); setValue(""); setMemo(""); setOpen(false); setShowAC(false);
  };

  const pickSuggestion = (s) => {
    setLabel(s);
    setShowAC(false);
    setTimeout(()=>inputRef.current?.focus(),0);
  };

  if(!open) return <button onClick={()=>setOpen(true)}
    style={{width:"100%",padding:"6px",borderRadius:8,border:`1px dashed ${color}50`,background:"transparent",color:`${color}90`,fontSize:11,cursor:"pointer",marginTop:8}}>
    + 항목 추가
  </button>;

  return (
    <div style={{marginTop:8,padding:"10px 8px",borderRadius:8,background:"rgba(108,99,255,0.05)",border:"1px solid rgba(108,99,255,0.15)"}}>
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
        {/* 항목명 + 자동완성 */}
        <div style={{flex:2,position:"relative"}}>
          <input ref={inputRef} value={label}
            onChange={e=>{setLabel(e.target.value);setShowAC(true);}}
            onFocus={()=>setShowAC(true)}
            onBlur={()=>setTimeout(()=>setShowAC(false),150)}
            onKeyDown={e=>{if(e.key==="Enter")commit();if(e.key==="Escape"){setShowAC(false);}}}
            autoFocus placeholder="항목명"
            style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.08)",border:`1px solid ${color}80`,borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,outline:"none"}}/>
          {showAC && suggestions.length > 0 && (
            <div style={{position:"absolute",top:"calc(100% + 3px)",left:0,right:0,zIndex:99,
              background:"#141428",border:"1px solid rgba(108,99,255,0.4)",borderRadius:8,overflow:"hidden",boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}>
              {suggestions.map((s,i)=>(
                <div key={i} onMouseDown={()=>pickSuggestion(s)}
                  style={{padding:"7px 11px",fontSize:11,color:"#c0c8e8",cursor:"pointer",borderBottom:"1px solid rgba(255,255,255,0.05)"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(108,99,255,0.2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
        <input value={value} onChange={e=>setValue(e.target.value.replace(/[^0-9]/g,""))} placeholder="금액"
          style={{flex:1,minWidth:70,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(107,203,119,0.4)",borderRadius:7,color:"#fff",padding:"5px 9px",fontSize:12,textAlign:"right",outline:"none"}}/>
      </div>
      <div style={{marginBottom:6}}>
        <input value={memo} onChange={e=>setMemo(e.target.value)} placeholder="📝 비고 (선택 사항)"
          style={{width:"100%",boxSizing:"border-box",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,color:"#b0b8d0",padding:"5px 10px",fontSize:11,outline:"none"}}/>
      </div>
      <div style={{display:"flex",gap:6}}>
        <button onClick={commit} style={{padding:"4px 10px",borderRadius:7,border:"none",background:"#6c63ff",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}}>추가</button>
        <button onClick={()=>{setOpen(false);setMemo("");setLabel("");setValue("");}} style={{padding:"4px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#5060a0",fontSize:11,cursor:"pointer"}}>취소</button>
      </div>
    </div>
  );
}


// ── 메인 ─────────────────────────────────────────────────────
const INIT = {
  2025: {
    inc: M25_INC,
    exp: M25_EXP,
    balance: BALANCE_2025,
    gongbi: makeEmptyGongbi(),
  }
};
const PREV_NW = { 2025: 544134658 };

// ── Firebase 동적 로더 ────────────────────────────────────────
const FB_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js",
];

function loadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function loadFirebase(config) {
  for (const src of FB_SCRIPTS) await loadScript(src);
  const fb = window.firebase;
  if (!fb.apps.length) fb.initializeApp(config);
  return fb.database();
}

// ── Firebase 설정 저장/로드 (localStorage) ────────────────────
const FB_KEY = "hj_gagyebu_fb_config";
const HARDCODED_CONFIG = {
  apiKey: "AIzaSyD5nUO9MBU2s1KYQzczP3V_7cXYkJ1VgF8",
  authDomain: "balance-sheet-2301e.firebaseapp.com",
  databaseURL: "https://balance-sheet-2301e-default-rtdb.firebaseio.com",
  projectId: "balance-sheet-2301e",
  storageBucket: "balance-sheet-2301e.firebasestorage.app",
  messagingSenderId: "235210874234",
  appId: "1:235210874234:web:4f55df00cee3b6a20c0ac3"
};
function savedConfig() {
  try { return JSON.parse(localStorage.getItem(FB_KEY)); } catch { return null; }
}
function saveConfig(cfg) { localStorage.setItem(FB_KEY, JSON.stringify(cfg)); }
function clearConfig() { localStorage.removeItem(FB_KEY); }

export default function App() {
  const [db, setDb]       = useState(null);      // Firebase DB instance
  const [syncing, setSyncing]   = useState(false);
  const [syncErr, setSyncErr]   = useState("");
  const [lastSync, setLastSync] = useState(null);
  const [years, setYears] = useState(INIT);
  const [selYear, setSelYear] = useState(2025);
  const [tab, setTab] = useState("overview");
  const [adding, setAdding] = useState(false);
  const [newY, setNewY] = useState("");
  const writeTimer = useRef(null);

  // Auto-connect with hardcoded config
  useEffect(() => {
    loadFirebase(HARDCODED_CONFIG).then(database => {
      setDb(database);
    }).catch(e => console.error("Firebase connect failed:", e));
  }, []);

  // Subscribe to Firebase on connect
  useEffect(() => {
    if (!db) return;
    setSyncing(true);
    const ref = db.ref("gagyebu");
    const handler = ref.on("value", snap => {
      const data = snap.val();
      if (data) {
        // Rebuild arrays (Firebase stores arrays as objects)
        const repaired = {};
        Object.entries(data).forEach(([yr, yd]) => {
          repaired[yr] = {
            inc:     yd.inc     ? Object.values(yd.inc).map(m => m ? Object.values(m) : []) : makeEmptyInc(),
            exp:     yd.exp     ? Object.values(yd.exp).map(m => m ? Object.values(m) : []) : makeEmptyExp(),
            balance: yd.balance ? Object.values(yd.balance) : makeEmptyBalance(),
            gongbi:  yd.gongbi  ? Object.values(yd.gongbi).map(m => m ? {혜정: m.혜정 ? Object.values(m.혜정) : [], 현: m.현 ? Object.values(m.현) : []} : {혜정:[],현:[]}) : makeEmptyGongbi(),
          };
        });
        setYears(repaired);
      }
      setSyncing(false);
      setLastSync(new Date());
    }, err => { setSyncErr(err.message); setSyncing(false); });
    return () => ref.off("value", handler);
  }, [db]);

  // Debounced write to Firebase
  const pushToFB = useCallback((newYears) => {
    if (!db) return;
    clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => {
      db.ref("gagyebu").set(newYears)
        .then(() => setLastSync(new Date()))
        .catch(e => setSyncErr(e.message));
    }, 600);
  }, [db]);

  const yearList = Object.keys(years).map(Number).sort();
  const cur = years[selYear];

  const updateInc = (mIdx, items) => setYears(p => {
    const n = {...p,[selYear]:{...p[selYear],inc:p[selYear].inc.map((m,i)=>i===mIdx?items:m)}};
    pushToFB(n); return n;
  });
  const updateExp = (mIdx, items) => setYears(p => {
    const n = {...p,[selYear]:{...p[selYear],exp:p[selYear].exp.map((m,i)=>i===mIdx?items:m)}};
    pushToFB(n); return n;
  });
  const updateBalance = (mIdx, data) => setYears(p => {
    const n = {...p,[selYear]:{...p[selYear],balance:p[selYear].balance.map((b,i)=>i===mIdx?data:b)}};
    pushToFB(n); return n;
  });
  const updateGongbi = (mIdx, person, items) => setYears(p => {
    const n = {...p,[selYear]:{...p[selYear],gongbi:p[selYear].gongbi.map((m,i)=>i===mIdx?{...m,[person]:items}:m)}};
    pushToFB(n); return n;
  });

  const [delConfirm, setDelConfirm] = useState(null); // 삭제 확인 중인 연도

  const deleteYear = (y) => {
    if (yearList.length <= 1) return; // 마지막 연도는 삭제 불가
    const newYears = {...years};
    delete newYears[y];
    setYears(newYears);
    pushToFB(newYears);
    // 삭제된 연도가 현재 선택된 연도면 다른 연도로 전환
    if (selYear === y) {
      const remaining = Object.keys(newYears).map(Number).sort();
      setSelYear(remaining[remaining.length - 1]);
    }
    setDelConfirm(null);
  };

  const addYear = () => {
    const y = parseInt(newY);
    if(!y||y<2000||y>2099||years[y]) return;
    setYears(p => {
      const n = {...p,[y]:{inc:makeEmptyInc(),exp:makeEmptyExp(),balance:makeEmptyBalance(),gongbi:makeEmptyGongbi()}};
      pushToFB(n); return n;
    });
    setSelYear(y); setAdding(false); setNewY("");
  };

  const exportCSV = () => {
    const yr = years[selYear];
    const rows = [];
    const esc = v => {
      const s = String(v ?? "");
      return (s.includes(",") || s.includes('"') || s.includes("\n")) ? `"${s.replace(/"/g,'""')}"` : s;
    };

    rows.push(["[수입]"]);
    rows.push(["월","항목명","담당","금액","비고"]);
    yr.inc.forEach((items,mi) => items.forEach(it =>
      rows.push([MONTHS[mi], it.label||"", it.payer||"", it.value||0, it.memo||""])));
    rows.push([]);

    rows.push(["[지출]"]);
    rows.push(["월","항목명","담당","그룹","금액","비고"]);
    yr.exp.forEach((items,mi) => items.forEach(it =>
      rows.push([MONTHS[mi], it.label||"", it.payer||"", it.group||"", it.value||0, it.memo||""])));
    rows.push([]);

    rows.push(["[공비]"]);
    rows.push(["월","담당","항목명","금액","비고"]);
    (yr.gongbi||[]).forEach((m,mi) =>
      ["혜정","현"].forEach(p => (m[p]||[]).forEach(it =>
        rows.push([MONTHS[mi], p, it.label||"", it.value||0, it.memo||""]))));
    rows.push([]);

    rows.push(["[자산]"]);
    rows.push(["월","항목명","비고","금액"]);
    yr.balance.forEach(b => (b.assets||[]).forEach(it =>
      rows.push([b.month, it.label||"", it.note||"", it.value||0])));
    rows.push([]);

    rows.push(["[부채]"]);
    rows.push(["월","항목명","금액"]);
    yr.balance.forEach(b => (b.debts||[]).forEach(it =>
      rows.push([b.month, it.label||"", it.value||0])));
    rows.push([]);

    rows.push(["[월별 요약]"]);
    rows.push(["월","총수입","총지출","잔액","자산총계","부채총계","순자산"]);
    MONTHS.forEach((m,mi) => {
      const inc = (yr.inc[mi]||[]).reduce((s,x)=>s+(x.value||0),0);
      const exp = (yr.exp[mi]||[]).reduce((s,x)=>s+(x.value||0),0);
      const b = yr.balance[mi]||{};
      rows.push([m, inc, exp, inc-exp, b.자산총계||0, b.부채총계||0, b.순자산||0]);
    });

    const csv = rows.map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download=`가계부_${selYear}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Show setup screen if no DB
  if (!db) return (
    <div style={{minHeight:"100vh",background:"#080812",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
      <div style={{fontSize:36}}>💑</div>
      <div style={{fontSize:16,fontWeight:700,background:"linear-gradient(90deg,#a78bfa,#4ecdc4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>혜정 & 현 가계부</div>
      <div style={{color:"#4050a0",fontSize:12}}>Firebase 연결 중...</div>
    </div>
  );

  return <div style={{minHeight:"100vh",background:"#080812",color:"#e0e0f0",fontFamily:"'Noto Sans KR','Apple SD Gothic Neo',sans-serif",paddingBottom:60}}>
    {/* 헤더 */}
    <div style={{background:"linear-gradient(135deg,rgba(108,99,255,.12),rgba(78,205,196,.07))",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"18px 22px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"space-between"}}>
        <div style={{width:32,height:32,borderRadius:10,background:"linear-gradient(135deg,#6c63ff,#4ecdc4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>💑</div>
        <div>
          <div style={{fontSize:17,fontWeight:800,background:"linear-gradient(90deg,#a78bfa,#4ecdc4)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>혜정 & 현 가계부</div>
          <div style={{color:"#2a2a70",fontSize:10}}>부부 공동 대차대조표 · 수입/지출 관리</div>
        </div>
      </div>
      <button onClick={exportCSV} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:18,border:"1px solid rgba(78,205,196,0.35)",background:"rgba(78,205,196,0.08)",color:"#4ecdc4",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>⬇︎ CSV 내보내기</button>
    </div>

    {/* 동기화 상태 바 */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"5px 22px",background:"rgba(255,255,255,0.015)",borderBottom:"1px solid rgba(255,255,255,0.04)",minHeight:28}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:6,height:6,borderRadius:3,background:syncErr?"#ff7070":syncing?"#f9ca24":"#6bcb77",boxShadow:syncErr?"0 0 6px #ff7070":syncing?"0 0 6px #f9ca24":"0 0 6px #6bcb77"}}/>
        <span style={{fontSize:10,color:syncErr?"#ff7070":syncing?"#b0a020":"#3a6040"}}>
          {syncErr ? "동기화 오류: "+syncErr : syncing ? "동기화 중..." : lastSync ? "✓ 동기화됨 "+lastSync.toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}) : "연결됨"}
        </span>
      </div>
      <button onClick={()=>{clearConfig();window.location.reload();}}
        style={{fontSize:10,color:"#3040a0",background:"none",border:"none",cursor:"pointer",padding:"2px 6px"}}>
        연결 해제
      </button>
    </div>

    {/* 연도 바 */}
    <div style={{display:"flex",alignItems:"center",gap:7,padding:"10px 22px",background:"rgba(255,255,255,0.02)",borderBottom:"1px solid rgba(255,255,255,0.05)",overflowX:"auto"}}>
      <span style={{color:"#3030a0",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>연도</span>
      {yearList.map(y => { const isSel=selYear===y, isConf=delConfirm===y; return (   <div key={y} style={{display:"flex",alignItems:"center",borderRadius:14,overflow:"hidden",     border:isSel?"1px solid rgba(108,99,255,0.5)":"1px solid rgba(255,255,255,0.08)"}}>     <button onClick={()=>{setSelYear(y);setDelConfirm(null);}} style={{padding:"4px 12px",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,       background:isSel?"linear-gradient(135deg,#6c63ff,#4ecdc4)":"rgba(255,255,255,0.07)",       color:isSel?"#fff":"#4050a0"}}>{y}년</button>     {yearList.length>1 && (isConf       ? <>           <button onClick={()=>deleteYear(y)} style={{padding:"4px 10px",border:"none",borderLeft:"1px solid rgba(255,60,60,0.5)",cursor:"pointer",fontSize:10,fontWeight:700,background:"rgba(210,30,30,0.95)",color:"#fff",whiteSpace:"nowrap"}}>삭제 확인</button>           <button onClick={()=>setDelConfirm(null)} style={{padding:"4px 7px",border:"none",borderLeft:"1px solid rgba(255,255,255,0.08)",cursor:"pointer",fontSize:11,background:"rgba(30,30,50,0.9)",color:"#5060a0"}}>✕</button>         </>       : <button onClick={(e)=>{e.stopPropagation();setDelConfirm(y);}} style={{padding:"4px 7px",border:"none",borderLeft:"1px solid rgba(255,255,255,0.07)",cursor:"pointer",fontSize:11,background:isSel?"rgba(0,0,0,0.18)":"rgba(255,255,255,0.04)",color:isSel?"rgba(255,255,255,0.4)":"#3040a0"}}>✕</button>     )}   </div> );})}
      {adding
        ?<div style={{display:"flex",gap:5,alignItems:"center"}}>
            <input autoFocus value={newY} onChange={e=>setNewY(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addYear()} placeholder="예) 2026"
              style={{width:76,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(108,99,255,0.4)",borderRadius:7,color:"#fff",padding:"3px 7px",fontSize:11,outline:"none"}}/>
            <button onClick={addYear} style={{padding:"3px 9px",borderRadius:7,border:"none",background:"#6c63ff",color:"#fff",fontSize:11,cursor:"pointer"}}>추가</button>
            <button onClick={()=>{setAdding(false);setNewY("");}} style={{padding:"3px 7px",borderRadius:7,border:"1px solid rgba(255,255,255,0.1)",background:"transparent",color:"#4050a0",fontSize:11,cursor:"pointer"}}>취소</button>
          </div>
        :<button onClick={()=>setAdding(true)} style={{padding:"3px 9px",borderRadius:13,border:"1px dashed rgba(108,99,255,0.35)",background:"transparent",color:"#6060b0",fontSize:11,cursor:"pointer"}}>+ 연도 추가</button>
      }
    </div>

    {/* 탭 */}
    <div style={{display:"flex",gap:7,padding:"10px 22px",overflowX:"auto"}}>
      {[["overview","📊 종합 현황"],["income","💰 수입/지출"],["balance","🏦 대차대조표"],["gongbi","📦 공비"]].map(([k,l])=><TB key={k} label={l} active={tab===k} onClick={()=>setTab(k)}/>)}
    </div>

    <div style={{padding:"0 22px"}}>
      {tab==="overview" && <OverviewTab yearData={cur} balanceData={cur.balance} prevYearNW={PREV_NW[selYear]||0}/>}
      {tab==="income"   && <IncExpTab yearData={cur} onUpdateInc={updateInc} onUpdateExp={updateExp} years={years} selYear={selYear} yearList={yearList}/>}
      {tab==="balance"  && <BalanceTab balanceMonths={cur.balance} onUpdate={updateBalance} years={years} selYear={selYear} yearList={yearList}/>}
      {tab==="gongbi"   && <GongbiTab gongbiData={cur.gongbi||makeEmptyGongbi()} onUpdate={updateGongbi}/>}
    </div>
  </div>;
}
