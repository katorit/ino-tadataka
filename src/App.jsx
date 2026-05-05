import { useState, useEffect, useRef, useCallback } from "react";
import * as exifr from "exifr";
import {
  auth, loginWithGoogle, logoutUser, onAuthStateChanged, getIdTokenResult,
  getVisits, saveVisits, subscribePhotos, uploadPhoto, deletePhoto,
  subscribeCustomMonuments, addCustomMonument, updateCustomMonument, deleteCustomMonument
} from "./firebase.js";

// ★ Google Maps APIキー
var GOOGLE_MAPS_API_KEY = "AIzaSyAZ_lLeAHuUTMKgtNoEHHDmqnDahlRlCFc";

var CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "";

/* === Monument Data === */
var MONUMENTS = [
  {id:"P01",lng:140.433514,lat:35.551302,name:"伊能忠敬先生出生の地",loc:"千葉県九十九里町"},
  {id:"P02",lng:140.46472,lat:35.679998,name:"伊能忠敬成長の処",loc:"千葉県横芝光町"},
  {id:"P03",lng:140.464567,lat:35.677989,name:"伊能忠敬父生活の処",loc:"千葉県横芝光町"},
  {id:"P04",lng:140.497911,lat:35.888272,name:"伊能忠敬旧宅",loc:"千葉県香取市"},
  {id:"P05",lng:140.497511,lat:35.88839,name:"伊能忠敬記念館",loc:"千葉県香取市"},
  {id:"P06",lng:140.490648,lat:35.89189,name:"伊能忠敬銅像",loc:"千葉県香取市"},
  {id:"P07",lng:140.499668,lat:35.880625,name:"伊能忠敬の墓",loc:"千葉県香取市"},
  {id:"P08",lng:139.794223,lat:35.674509,name:"伊能忠敬隠宅跡",loc:"東京都江東区"},
  {id:"P09",lng:139.799107,lat:35.671038,name:"伊能忠敬銅像",loc:"東京都江東区"},
  {id:"P10",lng:139.788776,lat:35.70148,name:"浅草司天台跡",loc:"東京都墨田区"},
  {id:"P11",lng:139.779832,lat:35.679352,name:"伊能忠敬終焉の地",loc:"東京都中央区"},
  {id:"P12",lng:139.784647,lat:35.714335,name:"伊能忠敬の墓碑",loc:"東京都台東区"},
  {id:"P13",lng:139.747848,lat:35.65532,name:"伊能忠敬測地遺功表",loc:"東京都港区"},
  {id:"P14",lng:140.517345,lat:35.623389,name:"伊能忠敬宿泊地・観測地",loc:"千葉県横芝光町"},
  {id:"P15",lng:140.840037,lat:35.707485,name:"伊能忠敬銚子測量記念碑",loc:"千葉県銚子市"},
  {id:"P16",lng:145.289538,lat:43.380614,name:"伊能測量隊到達最東端記念柱",loc:"北海道別海町"},
  {id:"P17",lng:140.698327,lat:42.588979,name:"伊能忠敬測量200年記念碑",loc:"北海道豊浦町"},
  {id:"P18",lng:140.982621,lat:42.36799,name:"伊能橋",loc:"北海道室蘭市"},
  {id:"P19",lng:140.238886,lat:41.448811,name:"北海道測量開始記念碑",loc:"北海道福島町"},
  {id:"P20",lng:140.704207,lat:41.759328,name:"伊能忠敬北海道最初の測量地",loc:"函館市"},
  {id:"P21",lng:130.073916,lat:32.326976,name:"伊能忠敬宿泊所跡",loc:"天草市河浦町"},
  {id:"P22",lng:140.542122,lat:41.219805,name:"史跡 伊能忠敬 止宿",loc:"青森県今別町"},
  {id:"P23",lng:140.752193,lat:40.827019,name:"伊能忠敬ゆかりの地",loc:"青森県青森市"},
  {id:"P24",lng:129.627207,lat:33.313837,name:"伊能忠敬木星観測之地",loc:"佐世保市"},
  {id:"P25",lng:129.683634,lat:33.151348,name:"伊能忠敬と九十九島",loc:"佐世保市"},
  {id:"P26",lng:139.43665,lat:38.191825,name:"伊能忠敬案内板",loc:"新潟県岩船町"},
  {id:"P27",lng:136.906051,lat:37.230019,name:"伊能忠敬投宿地",loc:"石川県穴水町"},
  {id:"P28",lng:137.688635,lat:34.713498,name:"伊能忠敬記念経緯度標",loc:"静岡県浜松市"},
  {id:"P29",lng:138.071528,lat:34.658955,name:"伊能忠敬宿泊地案内板",loc:"静岡県掛川市"},
  {id:"P30",lng:139.086572,lat:35.111713,name:"伊能忠敬宿泊之地",loc:"静岡県熱海市"},
  {id:"P31",lng:137.267349,lat:34.670183,name:"伊能忠敬緯度測定の地",loc:"愛知県田原市"},
  {id:"P32",lng:134.441649,lat:34.207457,name:"伊能忠敬上陸地点",loc:"徳島県鳴門市"},
  {id:"P33",lng:133.725711,lat:33.541309,name:"伊能忠敬緯度観測記念碑",loc:"高知県香南市"},
  {id:"P34",lng:132.756729,lat:33.876871,name:"伊能忠敬休息之地",loc:"松山市"},
  {id:"P35",lng:132.774465,lat:33.975423,name:"伊能忠敬来訪之地",loc:"松山市北条辻"},
  {id:"P36",lng:136.765753,lat:35.084339,name:"伊能忠敬測量之跡",loc:"愛知県飛島村"},
  {id:"P37",lng:134.541891,lat:35.005087,name:"伊能忠敬日本地図製図の地",loc:"兵庫県宍粟市"},
  {id:"P38",lng:129.657539,lat:33.194371,name:"伊能忠敬相浦測量記念碑",loc:"佐世保市"},
  {id:"P39",lng:134.371572,lat:35.028432,name:"伊能忠敬宿泊之地",loc:"兵庫県佐用町"},
  {id:"P40",lng:133.306902,lat:34.678353,name:"伊能忠敬測量の地",loc:"広島県神石高原町"},
  {id:"P41",lng:133.277229,lat:34.776917,name:"伊能忠敬測量隊宿泊邸跡",loc:"神石高原町"},
  {id:"P42",lng:129.8824,lat:32.75316,name:"伊能忠敬止宿 大同庵跡",loc:"長崎市"},
  {id:"P43",lng:128.847076,lat:32.694353,name:"坂部貞兵衛 書状",loc:"五島市"},
  {id:"P44",lng:132.865923,lat:34.179734,name:"旧柴屋住宅",loc:"広島県呉市"},
  {id:"P45",lng:132.974327,lat:35.205358,name:"伊能忠敬測量地点",loc:"島根県奥出雲町"},
  {id:"P46",lng:133.376436,lat:34.560254,name:"箱田良助生誕地",loc:"福山市神辺町"},
  {id:"P47",lng:130.372567,lat:33.204754,name:"伊能忠敬測量隊御宿跡",loc:"福岡県大川市"},
  {id:"P48",lng:130.448196,lat:33.035184,name:"伊能忠敬測量之地",loc:"福岡県大牟田市"},
  {id:"P49",lng:130.474488,lat:33.156574,name:"伊能忠敬測量基点之地",loc:"福岡県みやま市"},
  {id:"P50",lng:132.563981,lat:34.239779,name:"測量之図",loc:"呉市入船山記念館"},
  {id:"P51",lng:131.502894,lat:33.276415,name:"伊能忠敬測量歴史碑",loc:"大分県別府市"},
  {id:"P52",lng:133.087676,lat:34.40203,name:"伊能忠敬観測地",loc:"広島県三原市"},
  {id:"P53",lng:131.712792,lat:33.602121,name:"測量隊御宿跡",loc:"大分県杵築市"},
  {id:"P54",lng:131.61717,lat:33.416987,name:"測量隊別宿跡",loc:"大分県杵築市"},
  {id:"P55",lng:130.121137,lat:33.092908,name:"浜番所跡",loc:"佐賀県鹿島市"},
  {id:"P56",lng:130.147787,lat:32.80838,name:"深浦邸",loc:"長崎県雲仙市"},
  {id:"P57",lng:128.841559,lat:32.697201,name:"坂部貞兵衛の墓",loc:"長崎県五島市"},
  {id:"P58",lng:128.846385,lat:32.696797,name:"伊能忠敬 天測之地",loc:"長崎県五島市"},
  {id:"P59",lng:130.094951,lat:33.116082,name:"伊能忠敬一行宿泊の地",loc:"佐賀県鹿島市"},
  {id:"P60",lng:130.519237,lat:33.389537,name:"伊能忠敬測量基準点",loc:"佐賀県鳥栖市"},
  {id:"P61",lng:130.144361,lat:33.069194,name:"測量隊宿舎跡",loc:"佐賀県鹿島市"},
  {id:"P62",lng:130.095662,lat:33.117034,name:"鹿島宿継跡",loc:"佐賀県鹿島市"},
  {id:"P63",lng:130.372577,lat:33.2048,name:"測量隊御宿跡",loc:"福岡県大川市"},
  {id:"P64",lng:131.142791,lat:32.935889,name:"伊能忠敬宿泊の地",loc:"熊本県阿蘇市"},
  {id:"P65",lng:130.433913,lat:31.247174,name:"伊能忠敬先生絶賛の地",loc:"南九州市"},
  {id:"P66",lng:130.98742,lat:33.26249,name:"伊能忠敬宿泊の家",loc:"日田市大山町"},
  {id:"P67",lng:130.487168,lat:33.8507,name:"伊能忠敬宿泊跡",loc:"福岡県宗像市"},
  {id:"P68",lng:129.902506,lat:33.048909,name:"伊能忠敬休憩之地",loc:"長崎県東彼杵町"},
  {id:"P69",lng:129.985479,lat:33.096361,name:"伊能忠敬本陣跡",loc:"佐賀県嬉野市"},
  {id:"P70",lng:141.934464,lat:40.006486,name:"伊能忠敬測量記念碑",loc:"岩手県普代村"},
  {id:"P71",lng:141.885133,lat:39.2092,name:"星座石",loc:"釜石市唐丹町"},
  {id:"P72",lng:141.892695,lat:39.181034,name:"海上引縄測量之碑",loc:"釜石市"},
  {id:"P73",lng:138.936404,lat:35.313151,name:"伊能立ち寄り足跡",loc:"静岡県御殿場市"},
  {id:"P74",lng:133.306893,lat:34.67838,name:"伊能忠敬測量之地",loc:"神石高原"},
  {id:"P75",lng:134.000944,lat:35.067644,name:"絵画 伊能忠敬",loc:"津山高校"},
  {id:"P76",lng:135.560708,lat:34.671117,name:"伊能休憩地案内板",loc:"大阪市東成区"},
  {id:"P77",lng:135.43304,lat:34.527093,name:"伊能休憩地案内板",loc:"大阪府高石市"},
  {id:"P78",lng:130.448132,lat:33.035024,name:"伊能忠敬測量之地碑",loc:"大牟田市"},
  {id:"P79",lng:131.860797,lat:33.095739,name:"伊能忠敬測量遺跡",loc:"大分県津久見市"},
  {id:"P80",lng:131.69283,lat:33.239146,name:"伊能忠敬測量記念",loc:"大分市鶴崎"},
  {id:"P81",lng:140.436653,lat:41.193677,name:"蝦夷地測量の地",loc:"青森県外ヶ浜町"},
  {id:"P82",lng:134.205962,lat:33.394078,name:"経緯度観測之處",loc:"室戸市"},
  {id:"P83",lng:136.314422,lat:34.668216,name:"伊能忠敬測量の道",loc:"初瀬街道"},
  {id:"P84",lng:130.039626,lat:33.469915,name:"伊能忠敬の歌碑",loc:"佐賀福岡県境"},
  {id:"P85",lng:135.1125,lat:35.006944,name:"今田",loc:"丹波篠山市"},
  {id:"P86",lng:135.153333,lat:34.99611,name:"草野",loc:"丹波篠山市"},
  {id:"P87",lng:135.174721,lat:35.05722,name:"大沢",loc:"丹波篠山市"},
  {id:"P88",lng:135.193055,lat:35.061084,name:"宇土",loc:"丹波篠山市"},
  {id:"P89",lng:135.120555,lat:35.11416,name:"追入",loc:"丹波篠山市"},
  {id:"P90",lng:135.171388,lat:35.101388,name:"上板井",loc:"丹波篠山市"},
  {id:"P91",lng:135.184139,lat:35.090446,name:"西谷",loc:"丹波篠山市"},
  {id:"P92",lng:135.20406,lat:35.075974,name:"西岡屋",loc:"丹波篠山市"},
  {id:"P93",lng:135.216935,lat:35.075555,name:"北新町",loc:"丹波篠山市"},
  {id:"P94",lng:135.279444,lat:35.068888,name:"日置",loc:"丹波篠山市"},
  {id:"P95",lng:135.23611,lat:35.065054,name:"糟ケ坪",loc:"丹波篠山市"},
  {id:"P96",lng:135.343555,lat:35.07111,name:"福住",loc:"丹波篠山市"},
  {id:"P97",lng:140.871445,lat:38.447461,name:"伊能忠敬公 宿泊の記",loc:"宮城県大和町"},
  {id:"P98",lng:139.12128,lat:35.150254,name:"測量隊宿泊地",loc:"湯河原町"},
  {id:"P99",lng:139.111527,lat:35.143075,name:"測量隊昼食地",loc:"湯河原町"},
  {id:"P100",lng:139.101615,lat:35.147616,name:"測量隊参拝地",loc:"湯河原町城願寺"},
  {id:"P101",lng:141.886,lat:39.2095,name:"測量の碑",loc:"釜石市"},
  {id:"P102",lng:140.625714,lat:40.42219,name:"矢立峠測量記念標柱",loc:"大館市"},
  {id:"P103",lng:138.301591,lat:36.649849,name:"伊能忠敬測量位置",loc:"墨坂八幡神社"},
  {id:"P104",lng:136.662334,lat:36.5712,name:"測量隊宿泊地",loc:"金沢市"},
  {id:"P105",lng:135.473491,lat:35.542143,name:"ゆかりの宿",loc:"福井県高浜町"},
  {id:"P106",lng:137.179996,lat:34.785992,name:"蒲郡測量宿泊地跡",loc:"愛知県蒲郡市"},
  {id:"P107",lng:135.952768,lat:35.103763,name:"伊能忠敬が止まった寺",loc:"守山市"},
  {id:"P108",lng:134.115619,lat:35.038904,name:"伊能忠敬宿泊地",loc:"岡山県勝央町"},
  {id:"P109",lng:134.116224,lat:35.039495,name:"天体観測地",loc:"岡山県勝央町"},
  {id:"P110",lng:138.68608,lat:37.541527,name:"北国街道人物往来史",loc:"新潟県出雲崎"},
  {id:"P111",lng:139.45356,lat:38.23246,name:"伊能忠敬の碑",loc:"新潟県村上市"},
  {id:"P112",lng:130.401217,lat:33.119804,name:"測量跡碑",loc:"柳川市"},
  {id:"P113",lng:130.461634,lat:33.79021,name:"宿泊の地",loc:"福津市"},
  {id:"P114",lng:130.474179,lat:33.275591,name:"傘橋",loc:"久留米市"},
  {id:"P115",lng:130.847012,lat:33.671497,name:"測量止宿之地",loc:"福岡県香春町"},
  {id:"P116",lng:133.297697,lat:34.548799,name:"昼食之地",loc:"福山市"},
  {id:"P117",lng:130.862854,lat:30.463523,name:"種子島上陸の地",loc:"鹿児島県種子島"},
  {id:"P118",lng:130.567596,lat:30.420021,name:"伊能の碑",loc:"屋久島町"},
  {id:"P119",lng:131.323539,lat:31.998199,name:"八幡宮参詣",loc:"宮崎県国富町"},
  {id:"P120",lng:131.311636,lat:32.740209,name:"測量隊宿泊地",loc:"宮崎県高千穂町"},
  {id:"P121",lng:131.620568,lat:33.415815,name:"宿泊本陣跡",loc:"大分県杵築市"},
  {id:"P122",lng:131.021342,lat:33.205539,name:"先生宿泊之地",loc:"大分県日田市"},
  {id:"P123",lng:131.694711,lat:33.238165,name:"宿泊之跡",loc:"大分市"},
  {id:"P124",lng:131.798013,lat:33.241419,name:"宿泊の部屋",loc:"大分市神崎"},
  {id:"P125",lng:131.711712,lat:33.602242,name:"測量隊宿泊本陣",loc:"国東市"},
  {id:"P126",lng:131.73199,lat:33.549533,name:"測量隊宿泊本陣",loc:"国東市国東町"},
  {id:"P127",lng:131.720816,lat:33.463379,name:"測量隊宿泊本陣",loc:"国東市安岐町"},
  {id:"P128",lng:130.592981,lat:33.808952,name:"伊能忠敬が歩いた坂道",loc:"宗像市"},
  {id:"P133",lng:130.877983,lat:33.886059,name:"測量200年記念碑",loc:"北九州市"},
  {id:"P134",lng:130.81308,lat:33.904903,name:"方位石",loc:"北九州市若松区"},
  {id:"P135",lng:132.974691,lat:35.205319,name:"測量地点",loc:"島根県奥出雲町"},
  {id:"P136",lng:132.930355,lat:35.272514,name:"測量隊一行",loc:"島根県雲南市"},
  {id:"P137",lng:131.199131,lat:34.167597,name:"測量隊宿泊跡",loc:"美祢市"},
  {id:"P138",lng:134.541769,lat:35.005061,name:"日本地図製図の地",loc:"兵庫県宍粟市"},
  {id:"P139",lng:135.086492,lat:33.95878,name:"宿泊の地",loc:"和歌山県由良町"},
  {id:"P140",lng:135.512763,lat:34.658838,name:"麻田剛立の墓",loc:"大阪市天王寺区"},
  {id:"P141",lng:138.822492,lat:36.766486,name:"三国峠を超えた人々",loc:"水上町"},
  {id:"P142",lng:135.185383,lat:35.265123,name:"測量隊の歩いた道",loc:"福知山市"},
  {id:"P143",lng:132.437011,lat:34.366647,name:"讃嘆の地",loc:"広島市"},
  {id:"P147",lng:136.877466,lat:34.337795,name:"富士山方位測量の地",loc:"三重県志摩市"},
  {id:"P148",lng:140.055306,lat:37.770572,name:"測量の地",loc:"檜原峠"},
  {id:"P150",lng:130.539482,lat:33.451265,name:"原田駅の今昔",loc:"筑紫野市"},
  {id:"P151",lng:137.502428,lat:34.689164,name:"地図測量地点",loc:"湖西市"},
  {id:"P152",lng:133.053332,lat:35.469341,name:"方位測量地点",loc:"松江市"},
  {id:"P153",lng:138.83126,lat:37.352737,name:"高橋至時の諌書簡",loc:"長岡市"},
  {id:"M01",lng:141.9363,lat:45.522631,name:"間宮林蔵の銅像",loc:"宗谷岬"},
  {id:"M02",lng:140.032263,lat:35.940839,name:"間宮林蔵の生家",loc:"つくばみらい市"},
];

var BUILT_IN_IDS = new Set(MONUMENTS.map(function(m) { return m.id; }));

/* === Helpers === */
var REGIONS ={"北海道":"#059669","東北":"#2563eb","関東":"#7c3aed","中部":"#ea580c","近畿":"#db2777","中国":"#0d9488","四国":"#4f46e5","九州":"#dc2626"};

function getRegion(lat, lng) {
  if (lat >= 42) return "北海道";
  if (lat >= 38 && lng >= 139) return "東北";
  if (lat >= 35 && lng >= 138.5 && lng <= 141) return "関東";
  if (lat >= 34.5 && lng >= 136 && lng < 138.5) return "中部";
  if (lat >= 34 && lng >= 134.5 && lng < 136.5) return "近畿";
  if (lat >= 33.5 && lng >= 131 && lng < 134.5) return "中国";
  if (lat >= 33 && lng >= 132 && lng < 135) return "四国";
  if (lat < 34 && lng < 132) return "九州";
  if (lat >= 38) return "東北";
  if (lng >= 136 && lng < 138.5) return "中部";
  return "その他";
}

function makeSvg(color, isVisited, hasPhoto) {
  if (isVisited) {
    return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#f59e0b" stroke="#78350f" stroke-width="1.5"/><text x="14" y="18" text-anchor="middle" fill="#1e293b" font-size="13" font-weight="bold">\u2713</text></svg>');
  }
  var dot = hasPhoto ? '<circle cx="12" cy="12" r="5" fill="#fbbf24" opacity=".7"/>' : '<circle cx="12" cy="12" r="3" fill="white" opacity=".9"/>';
  return "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="36"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="' + color + '" stroke="#1e293b" stroke-width="1.5"/>' + dot + '</svg>');
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  var R = 6371000, rad = Math.PI / 180;
  var dLat = (lat2 - lat1) * rad, dLng = (lng2 - lng1) * rad;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

var GPS_RADIUS = 200;

/* === Map Engine Abstraction === */
function useMapEngine(mapRef) {
  var mapInst = useRef(null);
  var markersRef = useRef({});
  var engineRef = useRef(null);
  var [engineReady, setEngineReady] = useState(false);
  var [engineName, setEngineName] = useState("");

  useEffect(function () {
    if (GOOGLE_MAPS_API_KEY) {
      tryLoadGoogleMaps();
    } else {
      loadLeaflet();
    }

    function tryLoadGoogleMaps() {
      if (window.google && window.google.maps) { initGoogle(); return; }
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        setTimeout(function () {
          if (window.google && window.google.maps) { initGoogle(); } else { loadLeaflet(); }
        }, 2000);
        return;
      }
      var script = document.createElement("script");
      script.src = "https://maps.googleapis.com/maps/api/js?key=" + GOOGLE_MAPS_API_KEY + "&language=ja";
      script.onload = function () {
        if (window.google && window.google.maps) { initGoogle(); } else { loadLeaflet(); }
      };
      script.onerror = function () { loadLeaflet(); };
      document.head.appendChild(script);
      setTimeout(function () { if (!engineRef.current) loadLeaflet(); }, 20000);
    }

    function initGoogle() {
      if (!mapRef.current || mapInst.current) return;
      engineRef.current = "google";
      setEngineName("Google Maps");
      var map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 36.5, lng: 137.0 }, zoom: 6,
        mapTypeControl: false, streetViewControl: true, fullscreenControl: false,
        zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }, { featureType: "transit", stylers: [{ visibility: "simplified" }] }],
      });
      window.google.maps.event.addListener(map, "tilesloaded", function () {
        var errDiv = mapRef.current.querySelector(".gm-err-container");
        if (errDiv) { mapInst.current = null; engineRef.current = null; loadLeaflet(); }
      });
      mapInst.current = map;
      setEngineReady(true);
    }

    function loadLeaflet() {
      if (engineRef.current === "leaflet") return;
      if (document.getElementById("lf-css-tag")) { initLeaflet(); return; }
      var css = document.createElement("link");
      css.id = "lf-css-tag"; css.rel = "stylesheet";
      css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(css);
      var js = document.createElement("script");
      js.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      js.onload = function () { initLeaflet(); };
      document.head.appendChild(js);
    }

    function initLeaflet() {
      if (!mapRef.current || (mapInst.current && engineRef.current === "leaflet")) return;
      if (engineRef.current === "google") mapRef.current.innerHTML = "";
      engineRef.current = "leaflet";
      setEngineName("Leaflet (OSM)");
      var L = window.L;
      var map = L.map(mapRef.current, { zoomControl: false }).setView([36.5, 137.0], 6);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "\u00a9 OpenStreetMap", maxZoom: 18 }).addTo(map);
      mapInst.current = map;
      setEngineReady(true);
    }
  }, [mapRef]);

  var clearMarkers = useCallback(function () {
    var eng = engineRef.current;
    Object.values(markersRef.current).forEach(function (m) {
      if (eng === "google") m.setMap(null);
      else if (eng === "leaflet" && mapInst.current) mapInst.current.removeLayer(m);
    });
    markersRef.current = {};
  }, []);

  var addMarker = useCallback(function (m, iconUrl, size, onClick) {
    var eng = engineRef.current;
    if (eng === "google" && window.google) {
      var marker = new window.google.maps.Marker({
        position: { lat: m.lat, lng: m.lng }, map: mapInst.current,
        icon: { url: iconUrl, scaledSize: new window.google.maps.Size(size[0], size[1]), anchor: new window.google.maps.Point(size[0] / 2, size[1]) },
        title: m.name,
      });
      marker.addListener("click", onClick);
      markersRef.current[m.id] = marker;
    } else if (eng === "leaflet" && window.L) {
      var icon = window.L.icon({ iconUrl: iconUrl, iconSize: size, iconAnchor: [size[0] / 2, size[1]] });
      var mk = window.L.marker([m.lat, m.lng], { icon: icon }).addTo(mapInst.current);
      mk.on("click", onClick);
      markersRef.current[m.id] = mk;
    }
  }, []);

  var flyTo = useCallback(function (lat, lng, zoom) {
    var eng = engineRef.current;
    if (!mapInst.current) return;
    if (eng === "google") { mapInst.current.panTo({ lat: lat, lng: lng }); mapInst.current.setZoom(zoom || 14); }
    else if (eng === "leaflet") { mapInst.current.flyTo([lat, lng], zoom || 14, { duration: 1.2 }); }
  }, []);

  var userMarkerRef = useRef(null);
  var setUserLocation = useCallback(function (lat, lng) {
    var eng = engineRef.current;
    if (!mapInst.current) return;
    var iconUrl = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2.5"/><circle cx="10" cy="10" r="3" fill="white"/></svg>');
    if (eng === "google" && window.google) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setPosition({ lat, lng });
      } else {
        userMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng }, map: mapInst.current,
          icon: { url: iconUrl, scaledSize: new window.google.maps.Size(20, 20), anchor: new window.google.maps.Point(10, 10) },
          title: "現在地", zIndex: 9999,
        });
      }
    } else if (eng === "leaflet" && window.L) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        var icon = window.L.icon({ iconUrl, iconSize: [20, 20], iconAnchor: [10, 10] });
        userMarkerRef.current = window.L.marker([lat, lng], { icon, zIndexOffset: 9999 }).addTo(mapInst.current);
        userMarkerRef.current.bindPopup("現在地");
      }
    }
  }, []);

  return { engineReady, engineName, clearMarkers, addMarker, flyTo, setUserLocation };
}

/* === Photo Modal === */
function PhotoModal({ mon, photos, onClose, onAdd, onDel, user }) {
  const [dist, setDist] = useState(null);
  const [gpsMsg, setGpsMsg] = useState("位置情報を取得中...");
  const [preview, setPreview] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState(null);
  const [shotDate, setShotDate] = useState(null);
  const fileRef = useRef(null);

  useEffect(function () {
    if (!navigator.geolocation) { setGpsMsg("GPSが使えません"); return; }
    var wid = navigator.geolocation.watchPosition(
      function (p) { setDist(Math.round(distanceMeters(p.coords.latitude, p.coords.longitude, mon.lat, mon.lng))); setGpsMsg(""); },
      function (e) { setGpsMsg(e.code === 1 ? "位置情報の許可が必要です" : "位置情報を取得できません"); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
    return function () { navigator.geolocation.clearWatch(wid); };
  }, [mon]);

  var isNear = dist !== null && dist <= GPS_RADIUS;

  async function handleFile(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var isCamera = fileRef.current.hasAttribute("capture");
    if (!isCamera) {
      try {
        var gps = await exifr.gps(f);
        if (!gps || gps.latitude == null) {
          alert("この画像にはGPS情報がありません。カメラで撮影した写真のみアップロードできます。");
          return;
        }
        var d = distanceMeters(gps.latitude, gps.longitude, mon.lat, mon.lng);
        if (d > GPS_RADIUS) {
          alert("この写真の撮影地点は記念碑から" + Math.round(d) + "m離れています（" + GPS_RADIUS + "m以内が必要です）。");
          return;
        }
      } catch {
        alert("GPS情報を読み取れませんでした。カメラで撮影した写真を使用してください。");
        return;
      }
    }
    try {
      var exifData = await exifr.parse(f, { pick: ['DateTimeOriginal'] });
      if (exifData && exifData.DateTimeOriginal instanceof Date) {
        setShotDate(exifData.DateTimeOriginal.toISOString().split('T')[0]);
      } else {
        setShotDate(null);
      }
    } catch { setShotDate(null); }

    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var MAX = 800, w = img.width, h = img.height;
        if (w > MAX || h > MAX) { var r = Math.min(MAX / w, MAX / h); w *= r; h *= r; }
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        var data = c.toDataURL("image/jpeg", 0.7);
        setPreview(data); setFileData(data);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  }

  async function submit() {
    if (!fileData) return;
    setUploading(true);
    await onAdd(mon.id, fileData, comment.trim(), dist, shotDate);
    setUploading(false); setPreview(null); setFileData(null); setComment(""); setShotDate(null);
  }

  var IS = { width: "100%", padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={onClose}>
      <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflow: "auto" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{mon.id} ・ {mon.loc}</div>
            <div style={{ fontSize: 15, color: "#f8fafc", fontWeight: 700, marginTop: 2 }}>{mon.name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ padding: 16 }}>
          <div style={{ background: isNear ? "#052e16" : "#1c1917", border: "1px solid " + (isNear ? "#16a34a" : "#44403c"), borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: isNear ? "#22c55e" : (dist !== null ? "#ef4444" : "#a8a29e") }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: isNear ? "#4ade80" : "#a8a29e" }}>
                {gpsMsg || (dist !== null ? "現在地から " + dist + "m" : "位置取得中...")}
              </span>
            </div>
            {dist !== null && !isNear && <p style={{ margin: "6px 0 0", fontSize: 11, color: "#a8a29e" }}>記念碑から{GPS_RADIUS}m以内で写真投稿できます</p>}
            {isNear && <p style={{ margin: "4px 0 0", fontSize: 11, color: "#4ade80" }}>✓ 投稿可能エリア内です</p>}
          </div>
          {photos.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, fontWeight: 700 }}>投稿写真 ({photos.length})</div>
              {photos.map(function (p) {
                return (
                  <div key={p.docId} style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                    <img src={p.url} alt="" onClick={function () { setZoomedPhoto(p.url); }} style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                    <div style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 2 }}>{p.displayName}</div>
                        {p.cmt && <div style={{ fontSize: 12, color: "#cbd5e1" }}>{p.cmt}</div>}
                        <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>
                          {p.shotDate && <span>撮影 {p.shotDate} ・ </span>}投稿 {p.date} ・ {p.dist}m地点
                        </div>
                      </div>
                      {user && user.uid === p.userId && (
                        <button onClick={function () { onDel(p.docId, p.storagePath); }} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>削除</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700, marginBottom: 8 }}>写真を撮影・選択</div>
            {preview && <div style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden" }}><img src={preview} alt="" style={{ width: "100%", maxHeight: 180, objectFit: "cover", display: "block" }} /></div>}
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <button onClick={function () { fileRef.current.setAttribute("capture", "environment"); fileRef.current.click(); }} disabled={!isNear} style={{ flex: 1, padding: "10px 8px", background: isNear ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#334155", color: isNear ? "#1e293b" : "#64748b", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: isNear ? "pointer" : "not-allowed", fontFamily: "inherit" }}>カメラで撮影{!isNear ? "（要近傍）" : ""}</button>
              <button onClick={function () { fileRef.current.removeAttribute("capture"); fileRef.current.click(); }} style={{ flex: 1, padding: "10px 8px", background: "#1e3a5f", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>ライブラリ</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
            <input type="text" placeholder="コメント（任意）" value={comment} onChange={function (e) { setComment(e.target.value); }} style={Object.assign({}, IS, { marginBottom: 8 })} />
            <button onClick={submit} disabled={!fileData || uploading} style={{ width: "100%", padding: 10, background: fileData ? "linear-gradient(135deg,#22c55e,#16a34a)" : "#334155", color: fileData ? "white" : "#64748b", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: fileData ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
              {uploading ? "送信中..." : "投稿する"}
            </button>
            {!isNear && <p style={{ margin: "6px 0 0", fontSize: 10, color: "#64748b", textAlign: "center" }}>ライブラリ写真はEXIF GPS情報で位置を確認します</p>}
          </div>
        </div>
      </div>

      {zoomedPhoto && (
        <div onClick={function () { setZoomedPhoto(null); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={zoomedPhoto} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
    </div>
  );
}

/* === [追加] What's New Panel === */
function NewsPanel({ allPhotos, monsMap, onClose, onItemClick }) {
  var feed = allPhotos.filter(function (p) { return monsMap[p.monumentId]; });

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 2000, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ width: "100%", maxWidth: 380, background: "#1e293b", borderLeft: "1px solid #334155", display: "flex", flexDirection: "column", height: "100%" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#60a5fa" }}>What's New</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>最新の写真投稿</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 11, color: "#475569" }}>{feed.length}件</div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {feed.length === 0 && (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#475569", fontSize: 13, lineHeight: 1.8 }}>
              まだ投稿がありません。<br />記念碑を訪れて写真を投稿しましょう！
            </div>
          )}
          {feed.map(function (p) {
            var m = monsMap[p.monumentId];
            var rc = REGIONS[getRegion(m.lat, m.lng)] || "#6b7280";
            return (
              <div key={p.docId} style={{ borderBottom: "1px solid #0f172a" }}>
                <div style={{ position: "relative", cursor: "pointer" }} onClick={function () { onItemClick(m); }}>
                  <img src={p.url} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))", padding: "24px 12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: rc, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>{m.name}</span>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "8px 12px 10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      <span style={{ color: "#94a3b8", marginRight: 4 }}>{m.id}</span>{m.loc}
                    </div>
                    <div style={{ fontSize: 10, color: "#475569" }}>
                      {p.shotDate && <span>撮影 {p.shotDate} ・ </span>}
                      投稿 {p.date}
                    </div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: "#60a5fa" }}>{p.displayName || "ゲスト"}</div>
                    {p.dist && <div style={{ fontSize: 9, color: "#475569" }}>{p.dist}m地点から</div>}
                  </div>
                  {p.cmt && <div style={{ fontSize: 12, color: "#cbd5e1", marginTop: 4, lineHeight: 1.4 }}>{p.cmt}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* === Main App === */
export default function App() {
  var mapDivRef = useRef(null);
  var engine = useMapEngine(mapDivRef);
  const [mons, setMons] = useState(MONUMENTS);
  const [sel, setSel] = useState(null);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [vis, setVis] = useState({});
  const [allPhotos, setAllPhotos] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showNews, setShowNews] = useState(false); // [追加]
  const [form, setForm] = useState({ n: "", l: "", la: "", ln: "" });
  const [query, setQuery] = useState("");
  const [filterReg, setFilterReg] = useState("all");
  const [filterVis, setFilterVis] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingMon, setEditingMon] = useState(null);

  // 写真をmonumentIdでグループ化
  var pho = allPhotos.reduce(function (acc, p) {
    if (!acc[p.monumentId]) acc[p.monumentId] = [];
    acc[p.monumentId].push(p);
    return acc;
  }, {});

  // [追加] Monument lookup map（What's Newで使用）
  var monsMap = {};
  mons.forEach(function (m) { monsMap[m.id] = m; });

  // Auth状態監視
  useEffect(function () {
    var unsubAuth = onAuthStateChanged(auth, async function (u) {
      setUser(u);
      setIsAdmin(false);
      if (u) {
        try { var visits = await getVisits(u.uid); setVis(visits); } catch { setVis({}); }
        try {
          var token = await getIdTokenResult(u, true);
          setIsAdmin(token.claims && token.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setVis({});
      }
      setAuthLoading(false);
    });
    return unsubAuth;
  }, []);

  // 写真リアルタイム購読
  useEffect(function () {
    var unsub = subscribePhotos(setAllPhotos);
    return unsub;
  }, []);

  // カスタム記念碑（Firestore・全ユーザー共有）
  useEffect(function () {
    var unsub = subscribeCustomMonuments(function (custom) {
      setMons(MONUMENTS.concat(custom));
    });
    return unsub;
  }, []);

  var engineReady = engine.engineReady;
  var setUserLocation = engine.setUserLocation;

  // 現在地をマップにプロット
  useEffect(function () {
    if (!engineReady) return;
    if (!navigator.geolocation) return;
    var wid = navigator.geolocation.watchPosition(
      function (p) { setUserLocation(p.coords.latitude, p.coords.longitude); },
      function () {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return function () { navigator.geolocation.clearWatch(wid); };
  }, [engineReady, setUserLocation]);

  async function toggleVisit(id) {
    if (!user) { alert("訪問記録にはGoogleログインが必要です"); return; }
    var n = Object.assign({}, vis);
    if (n[id]) { delete n[id]; } else { n[id] = true; }
    setVis(n);
    await saveVisits(user.uid, n);
  }

  async function addPhoto(mid, data, cmt, dist, shotDate) {
    if (!user) return;
    await uploadPhoto(user.uid, mid, data, cmt, dist, user.displayName || "ゲスト", shotDate);
    if (!vis[mid]) {
      var nv = Object.assign({}, vis, { [mid]: true });
      setVis(nv);
      await saveVisits(user.uid, nv);
    }
  }

  async function delPhoto(docId, storagePath) {
    await deletePhoto(docId, storagePath);
  }

  async function addMonument() {
    if (!form.n || !form.la || !form.ln) return;
    await addCustomMonument({
      name: form.n, loc: form.l || "",
      lat: parseFloat(form.la), lng: parseFloat(form.ln)
    });
    setForm({ n: "", l: "", la: "", ln: "" });
  }

  // [追加] What's Newからのアイテムクリック
  function handleNewsItemClick(m) {
    setShowNews(false);
    engine.flyTo(m.lat, m.lng, 14);
    setSel(m);
  }

  var filterList = useCallback(function (list) {
    return list.filter(function (m) {
      if (query) { var q = query.toLowerCase(); if (m.name.toLowerCase().indexOf(q) < 0 && m.loc.toLowerCase().indexOf(q) < 0 && m.id.toLowerCase().indexOf(q) < 0) return false; }
      if (filterReg !== "all" && getRegion(m.lat, m.lng) !== filterReg) return false;
      if (filterVis === "visited" && !vis[m.id]) return false;
      if (filterVis === "unvisited" && vis[m.id]) return false;
      return true;
    });
  }, [query, filterReg, filterVis, vis]);

  useEffect(function () {
    if (!engine.engineReady) return;
    engine.clearMarkers();
    filterList(mons).forEach(function (m) {
      var rc = REGIONS[getRegion(m.lat, m.lng)] || "#6b7280";
      var iv = !!vis[m.id], hp = (pho[m.id] || []).length > 0;
      var sz = iv ? [28, 40] : [24, 36];
      engine.addMarker(m, makeSvg(rc, iv, hp), sz, function () { setSel(m); });
    });
  }, [mons, vis, pho, engine.engineReady, filterList, engine]);

  function flyTo(m) { engine.flyTo(m.lat, m.lng, 14); setSel(m); }

  var fl = filterList(mons);
  var vc = Object.keys(vis).length;
  var pc = Object.values(pho).reduce(function (s, a) { return s + a.length; }, 0);
  var pct = mons.length > 0 ? Math.round((vc / mons.length) * 100) : 0;
  var IS = { width: "100%", padding: "8px 12px", background: "#0f172a", border: "1px solid #334155", borderRadius: 6, color: "#e2e8f0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };

  return (
    <div style={{ width: "100%", height: "100dvh", display: "flex", flexDirection: "column", fontFamily: "'Noto Serif JP','Hiragino Mincho ProN',serif", background: "#0f172a", color: "#e2e8f0", overflow: "hidden", position: "relative" }}>
      {authLoading && (
        <div style={{ position: "absolute", inset: 0, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ color: "#94a3b8" }}>読み込み中...</div>
        </div>
      )}
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap" rel="stylesheet" />
      <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a,#1a1a2e)", borderBottom: "1px solid #334155", padding: "8px 10px", zIndex: 1000, flexShrink: 0 }}>
        {/* 1行目: タイトル */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
            <button onClick={function () { setSidebarOpen(!sidebarOpen); }} style={{ background: "none", border: "1px solid #475569", color: "#94a3b8", padding: "4px 7px", borderRadius: 5, cursor: "pointer", fontSize: 14, flexShrink: 0 }}>☰</button>
            <button onClick={function () { setShowAbout(true); }} style={{ background: "none", border: "1px solid #475569", color: "#94a3b8", padding: "4px 7px", borderRadius: 5, cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>？</button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f8fafc", letterSpacing: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>伊能忠敬 記念碑巡り</div>
            </div>
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <img src={user.photoURL} alt={user.displayName} title={user.displayName} style={{ width: 24, height: 24, borderRadius: "50%", border: "1px solid #475569" }} />
              <button onClick={logoutUser} style={{ background: "transparent", color: "#94a3b8", border: "1px solid #475569", padding: "3px 6px", borderRadius: 5, cursor: "pointer", fontSize: 9, fontFamily: "inherit" }}>退出</button>
              {isAdmin && (
                <button onClick={function () { setShowAdmin(!showAdmin); }} style={{ background: showAdmin ? "#f59e0b" : "transparent", color: showAdmin ? "#1e293b" : "#94a3b8", border: "1px solid #475569", padding: "3px 6px", borderRadius: 5, cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit" }}>管理</button>
              )}
            </div>
          ) : (
            <button onClick={loginWithGoogle} style={{ background: "linear-gradient(135deg,#4285f4,#1a73e8)", color: "white", border: "none", padding: "4px 8px", borderRadius: 5, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}>ログイン</button>
          )}
        </div>
        {/* 2行目: 進捗 + NEWボタン + エンジン情報 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 9, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
            {engine.engineName || "地図読込中"} ・ {mons.length}碑
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>踏破{vc}/{mons.length} 📷{pc}</div>
            <div style={{ width: 60, height: 5, background: "#1e293b", borderRadius: 3, border: "1px solid #334155", overflow: "hidden" }}>
              <div style={{ width: pct + "%", height: "100%", background: "linear-gradient(90deg,#f59e0b,#ef4444)", borderRadius: 3, transition: "width .5s" }} />
            </div>
            <button onClick={function () { setShowNews(!showNews); }} style={{ background: showNews ? "#3b82f6" : "transparent", color: showNews ? "white" : "#94a3b8", border: "1px solid #475569", padding: "2px 6px", borderRadius: 5, cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: "inherit", position: "relative", flexShrink: 0 }}>
              NEW
              {allPhotos.length > 0 && !showNews && (
                <span style={{ position: "absolute", top: -4, right: -4, minWidth: 13, height: 13, background: "#ef4444", borderRadius: 7, fontSize: 7, color: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px" }}>{allPhotos.length > 99 ? "99+" : allPhotos.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", position: "relative", overflow: "hidden" }}>
        <div style={{ width: sidebarOpen ? 300 : 0, minWidth: sidebarOpen ? 300 : 0, background: "#1e293b", borderRight: sidebarOpen ? "1px solid #334155" : "none", transition: "all .3s", overflow: "hidden", display: "flex", flexDirection: "column", zIndex: 999, position: "absolute", top: 0, left: 0, bottom: 0 }}>
          <div style={{ padding: 10, borderBottom: "1px solid #334155" }}>
            <input type="text" placeholder="検索..." value={query} onChange={function (e) { setQuery(e.target.value); }} style={IS} />
            <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
              <select value={filterReg} onChange={function (e) { setFilterReg(e.target.value); }} style={{ flex: 1, padding: 5, background: "#0f172a", border: "1px solid #334155", borderRadius: 5, color: "#e2e8f0", fontSize: 11, fontFamily: "inherit" }}>
                <option value="all">全地域</option>
                {Object.keys(REGIONS).map(function (r) { return (<option key={r} value={r}>{r}</option>); })}
              </select>
              <select value={filterVis} onChange={function (e) { setFilterVis(e.target.value); }} style={{ flex: 1, padding: 5, background: "#0f172a", border: "1px solid #334155", borderRadius: 5, color: "#e2e8f0", fontSize: 11, fontFamily: "inherit" }}>
                <option value="all">すべて</option>
                <option value="visited">訪問済</option>
                <option value="unvisited">未訪問</option>
              </select>
            </div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>{fl.length}件</div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {fl.map(function (m) {
              var rc = REGIONS[getRegion(m.lat, m.lng)] || "#6b7280";
              var iv = !!vis[m.id], hp = (pho[m.id] || []).length > 0, isSel = sel && sel.id === m.id;
              return (
                <div key={m.id} onClick={function () { flyTo(m); }} style={{ padding: "8px 10px", borderBottom: "1px solid rgba(30,41,59,0.25)", cursor: "pointer", background: isSel ? "#334155" : "transparent", display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", marginTop: 5, flexShrink: 0, background: iv ? "#f59e0b" : rc }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: iv ? "#fbbf24" : "#e2e8f0", lineHeight: 1.3 }}>
                      <span style={{ color: "#64748b", fontSize: 10, marginRight: 3 }}>{m.id}</span>{m.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>{m.loc}</div>
                  </div>
                  <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                    {hp && <span style={{ fontSize: 11 }}>📷</span>}
                    {iv && <span style={{ fontSize: 13, color: "#f59e0b" }}>✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, position: "relative" }}>
          <div ref={mapDivRef} style={{ width: "100%", height: "100%" }} />
          {sel && !showPhoto && (
            <div style={{ position: "absolute", bottom: "calc(14px + env(safe-area-inset-bottom, 0px))", left: "50%", transform: "translateX(-50%)", background: "rgba(15,23,42,0.94)", backdropFilter: "blur(12px)", border: "1px solid #334155", borderRadius: 12, padding: "12px 16px", maxWidth: 420, width: "calc(100% - 28px)", zIndex: 998 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#64748b" }}>{sel.id} ・ {getRegion(sel.lat, sel.lng)}{(pho[sel.id] || []).length > 0 && (" ・ 📷" + (pho[sel.id] || []).length)}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: vis[sel.id] ? "#fbbf24" : "#f8fafc", marginTop: 2 }}>{sel.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{sel.loc}</div>
                </div>
                <button onClick={function () { setSel(null); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 17, cursor: "pointer" }}>✕</button>
              </div>
              {(pho[sel.id] || []).length > 0 && (
                <div style={{ display: "flex", gap: 5, marginTop: 8, overflowX: "auto" }}>
                  {(pho[sel.id] || []).slice(0, 5).map(function (p, i) {
                    return (<img key={i} src={p.url} alt="" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 5, border: "1px solid #475569", flexShrink: 0, cursor: "pointer" }} onClick={function () { setShowPhoto(true); }} />);
                  })}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, marginTop: 9, flexWrap: "wrap" }}>
                <button onClick={function () { toggleVisit(sel.id); }} style={{ flex: 1, minWidth: 80, padding: "7px 8px", background: vis[sel.id] ? "linear-gradient(135deg,#92400e,#78350f)" : "linear-gradient(135deg,#f59e0b,#d97706)", color: vis[sel.id] ? "#fbbf24" : "#1e293b", border: "none", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {vis[sel.id] ? "✓ 訪問済み" : "訪問済みにする"}
                </button>
                <button onClick={function () { setShowPhoto(true); }} style={{ padding: "7px 10px", background: "#1e3a5f", color: "#60a5fa", border: "1px solid rgba(37,99,235,0.25)", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📷 写真</button>
                <button onClick={function () { window.open("https://www.google.com/maps/dir/?api=1&destination=" + sel.lat + "," + sel.lng + "&travelmode=driving", "_blank"); }} style={{ padding: "7px 10px", background: "#334155", color: "#94a3b8", border: "1px solid #475569", borderRadius: 7, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>ナビ↗</button>
                {user && isAdmin && !BUILT_IN_IDS.has(sel.id) && (
                  <button onClick={function () { setEditingMon(sel); setForm({ n: sel.name, l: sel.loc || "", la: String(sel.lat), ln: String(sel.lng) }); setShowAdmin(true); }} style={{ padding: "7px 10px", background: "#422006", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>✎ 編集</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* [追加] What's New パネル */}
      {showNews && (
        <NewsPanel
          allPhotos={allPhotos}
          monsMap={monsMap}
          onClose={function () { setShowNews(false); }}
          onItemClick={handleNewsItemClick}
        />
      )}

      {showAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={function () { setShowAdmin(false); setEditingMon(null); setForm({ n: "", l: "", la: "", ln: "" }); }}>
          <div style={{ background: "#1e293b", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 14, padding: 16, width: "100%", maxWidth: 320 }} onClick={function (e) { e.stopPropagation(); }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{editingMon ? "✎ 記念碑を編集" : "＋ 記念碑を追加"}</div>
              <button onClick={function () { setShowAdmin(false); setEditingMon(null); setForm({ n: "", l: "", la: "", ln: "" }); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>

            {!editingMon && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>Google Maps URL（貼り付けると座標を自動入力）</div>
                <input type="text" placeholder="https://www.google.com/maps/..." onChange={function (e) {
                  var url = e.target.value;
                  var lat3d = url.match(/!3d(-?\d+\.\d+)/);
                  var lng4d = url.match(/!4d(-?\d+\.\d+)/);
                  if (lat3d && lng4d) {
                    setForm(function (f) { return Object.assign({}, f, { la: lat3d[1], ln: lng4d[1] }); });
                  } else {
                    var m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/) || url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
                    if (m) setForm(function (f) { return Object.assign({}, f, { la: m[1], ln: m[2] }); });
                  }
                }} style={Object.assign({}, IS, { fontSize: 11 })} />
              </div>
            )}

            {[{ k: "n", l: "記念碑名" }, { k: "l", l: "所在地" }, { k: "la", l: "緯度" }, { k: "ln", l: "経度" }].map(function (item) {
              return (
                <div key={item.k} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 2 }}>{item.l}</div>
                  <input type={item.k === "la" || item.k === "ln" ? "number" : "text"} step="any" value={form[item.k]} onChange={function (e) { setForm(Object.assign({}, form, { [item.k]: e.target.value })); }} style={Object.assign({}, IS, { fontSize: 12 })} />
                </div>
              );
            })}

            {editingMon ? (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button onClick={async function () {
                  if (!form.n || !form.la || !form.ln) return;
                  await updateCustomMonument(editingMon.id, { name: form.n, loc: form.l || "", lat: parseFloat(form.la), lng: parseFloat(form.ln) });
                  setShowAdmin(false); setEditingMon(null); setForm({ n: "", l: "", la: "", ln: "" });
                }} disabled={!form.n || !form.la || !form.ln} style={{ flex: 1, padding: 8, background: (form.n && form.la && form.ln) ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#334155", color: (form.n && form.la && form.ln) ? "#1e293b" : "#64748b", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: (form.n && form.la && form.ln) ? "pointer" : "not-allowed" }}>更新する</button>
                <button onClick={async function () {
                  if (!window.confirm("「" + editingMon.name + "」を削除しますか？")) return;
                  await deleteCustomMonument(editingMon.id);
                  setSel(null); setShowAdmin(false); setEditingMon(null); setForm({ n: "", l: "", la: "", ln: "" });
                }} style={{ padding: "8px 12px", background: "#7f1d1d", color: "#fca5a5", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>削除</button>
              </div>
            ) : (
              <button onClick={function () { addMonument(); setShowAdmin(false); }} disabled={!form.n || !form.la || !form.ln} style={{ width: "100%", padding: 8, background: (form.n && form.la && form.ln) ? "linear-gradient(135deg,#f59e0b,#d97706)" : "#334155", color: (form.n && form.la && form.ln) ? "#1e293b" : "#64748b", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: "inherit", marginTop: 3, cursor: (form.n && form.la && form.ln) ? "pointer" : "not-allowed" }}>追加する</button>
            )}

            {!editingMon && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #334155", fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                <div style={{ color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>場所の追加リクエスト</div>
                Google Mapsで場所を開き、URLをコピーして<br />
                {CONTACT_EMAIL ? (
                  <><a href={"mailto:" + CONTACT_EMAIL + "?subject=伊能忠敬マップ 場所の追加リクエスト"} style={{ color: "#60a5fa" }}>{CONTACT_EMAIL}</a> までお送りください。</>
                ) : (
                  <>管理者までお送りください。</>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showPhoto && sel && (
        <PhotoModal mon={sel} photos={pho[sel.id] || []} onClose={function () { setShowPhoto(false); }} onAdd={addPhoto} onDel={delPhoto} user={user} />
      )}

      {showAbout && (
        <div onClick={function () { setShowAbout(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={function (e) { e.stopPropagation(); }} style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 16, maxWidth: 480, width: "100%", maxHeight: "88vh", overflow: "auto" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>伊能忠敬 記念碑巡りマップとは</div>
              <button onClick={function () { setShowAbout(false); }} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: "16px 18px", fontSize: 13, color: "#cbd5e1", lineHeight: 1.8 }}>
              <p style={{ marginTop: 0 }}>伊能忠敬およびゆかりの人物に関する<strong style={{ color: "#f8fafc" }}>記念碑・史跡{MONUMENTS.length}か所</strong>を地図上にプロットしたスタンプラリーアプリです。</p>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>主な機能</div>
                <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  <li>地図上の記念碑ピンをタップして詳細を確認</li>
                  <li>Googleログイン後に訪問済みとしてマーク（自分だけに反映）</li>
                  <li>記念碑近傍でカメラ撮影、または撮影済み写真をアップロード</li>
                  <li>投稿写真はユーザー間で共有・閲覧可能</li>
                  <li>地域・訪問状況でフィルタリング</li>
                  <li>What's Newで最新の写真投稿をタイムライン表示</li>
                  <li>Google Mapsで現地ナビ起動</li>
                  <li>ホーム画面に追加してアプリとして利用可能</li>
                </ul>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>地図の色について</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
                  {Object.entries({"北海道":"#059669","東北":"#2563eb","関東":"#7c3aed","中部":"#ea580c","近畿":"#db2777","中国":"#0d9488","四国":"#4f46e5","九州":"#dc2626"}).map(function ([r, c]) {
                    return (<span key={r} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: c, display: "inline-block" }} />{r}</span>);
                  })}
                  <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />訪問済み</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>ホーム画面に追加（アプリ化）</div>
                <p style={{ margin: "0 0 6px", fontSize: 12 }}>このサイトはアプリとしてホーム画面に追加できます。フルスクリーンで快適に使えます。</p>
                <div style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, padding: 10, fontSize: 11, lineHeight: 1.7 }}>
                  <div style={{ color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>iPhoneの場合（Safari）</div>
                  <div>1. 画面下の共有ボタン <span style={{ color: "#60a5fa" }}>□↑</span> をタップ</div>
                  <div>2.「ホーム画面に追加」をタップ</div>
                  <div>3.「追加」をタップ</div>
                  <div style={{ color: "#94a3b8", fontWeight: 700, marginTop: 8, marginBottom: 4 }}>Androidの場合（Chrome）</div>
                  <div>1. 右上の <span style={{ color: "#60a5fa" }}>⋮</span> メニューをタップ</div>
                  <div>2.「ホーム画面に追加」をタップ</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #334155", paddingTop: 12, marginTop: 4, fontSize: 11, color: "#64748b" }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", marginBottom: 4 }}>座標データについて</div>
                <p style={{ margin: 0 }}>
                  記念碑の座標データは、以下のサイトの情報を参考にさせていただきました。<br />
                  <a href="https://ss357894.stars.ne.jp/" target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa" }}>https://ss357894.stars.ne.jp/</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
