/**
 * 城市卡牌游戏 - 城市数据模块
 * 包含中国所有省份的城市信息和玩家默认名称
 */

// 默认玩家名称
const DEFAULT_NAMES = ['Whale','CRH380BL-3562','Sirius North','猎奇凤爱莉'];

// 省份城市数据

    const 直辖市和特区 = [
      {name: '北京市', hp: 52073},
      {name: '上海市', hp: 56709},
      {name: '天津市', hp: 18540},
      {name: '重庆市', hp: 33758},
      {name: '香港特别行政区', hp: 30588},
      {name: '澳门特别行政区', hp: 3741},
    ];

    const 河北省 = [
      {name: '石家庄市', hp: 8652},
      {name: '唐山市', hp: 10004},
      {name: '秦皇岛市', hp: 2121},
      {name: '邯郸市', hp: 4920},
      {name: '邢台市', hp: 2766},
      {name: '保定市', hp: 5003},
      {name: '张家口市', hp: 1913},
      {name: '承德市', hp: 1963},
      {name: '沧州市', hp: 4931},
      {name: '廊坊市', hp: 3904},
      {name: '衡水市', hp: 2012},
      {name: '雄安新区', hp: 621}
    ];

    const 山西省 = [
      {name: '太原市', hp: 5419},
      {name: '大同市', hp: 1815},
      {name: '阳泉市', hp: 871},
      {name: '长治市', hp: 2558},
      {name: '晋城市', hp: 2410},
      {name: '朔州市', hp: 1329},
      {name: '忻州市', hp: 1343},
      {name: '吕梁市', hp: 2575},
      {name: '晋中市', hp: 2463},
      {name: '临汾市', hp: 2439},
      {name: '运城市', hp: 2248}
    ];

    const 内蒙古自治区 = [
      {name: '呼和浩特市', hp: 4278},
      {name: '包头市', hp: 4712},
      {name: '乌海市', hp: 541},
      {name: '赤峰市', hp: 2407},
      {name: '呼伦贝尔市', hp: 1750},
      {name: '兴安盟', hp: 850},
      {name: '通辽市', hp: 1738},
      {name: '锡林郭勒盟', hp: 1290},
      {name: '乌兰察布市', hp: 1260},
      {name: '鄂尔多斯市', hp: 6122},
      {name: '巴彦淖尔市', hp: 1278},
      {name: '阿拉善盟', hp: 419}
];

    const 辽宁省 = [
      {name: '沈阳市', hp: 9100},
      {name: '大连市', hp: 10002},
      {name: '鞍山市', hp: 2180},
      {name: '抚顺市', hp: 1004},
      {name: '本溪市', hp: 1026},
      {name: '丹东市', hp: 1019},
      {name: '锦州市', hp: 1365},
      {name: '营口市', hp: 1570},
      {name: '阜新市', hp: 650},
      {name: '辽阳市', hp: 1001},
      {name: '盘锦市', hp: 1418},
      {name: '铁岭市', hp: 789},
      {name: '朝阳市', hp: 1157},
      {name: '葫芦岛市', hp: 1014}
    ];

    const 吉林省 = [
      {name: '长春市', hp: 8006},
      {name: '吉林市', hp: 1633},
      {name: '四平市', hp: 581},
      {name: '辽源市', hp: 528},
      {name: '通化市', hp: 766},
      {name: '白山市', hp: 568},
      {name: '白城市', hp: 614},
      {name: '延边州', hp: 1018},
      {name: '松原市', hp: 1002}
    ];

    const 黑龙江省 = [
      {name: '哈尔滨市', hp: 6189},
      {name: '齐齐哈尔市', hp: 1402},
      {name: '牡丹江市', hp: 1051},
      {name: '佳木斯市', hp: 1008},
      {name: '大庆市', hp: 2693},
      {name: '伊春市', hp: 381},
      {name: '鸡西市', hp: 649},
      {name: '鹤岗市', hp: 376},
      {name: '双鸭山市', hp: 571},
      {name: '七台河市', hp: 237},
      {name: '绥化市', hp: 1285},
      {name: '黑河市', hp: 742},
      {name: '大兴安岭地区', hp: 178}
    ];

    const 江苏省 = [
      {name: '南京市', hp: 19429},
      {name: '无锡市', hp: 16774},
      {name: '徐州市', hp: 9537},
      {name: '常州市', hp: 11159},
      {name: '苏州市', hp: 26727},
      {name: '南通市', hp: 12422},
      {name: '连云港市', hp: 4663},
      {name: '淮安市', hp: 5413},
      {name: '盐城市', hp: 7779},
      {name: '扬州市', hp: 7810},
      {name: '镇江市', hp: 5540},
      {name: '泰州市', hp: 7021},
      {name: '宿迁市', hp: 5027}
    ];

    const 浙江省 = [
      {name: '杭州市', hp: 23011},
      {name: '宁波市', hp: 18716},
      {name: '温州市', hp: 10214},
      {name: '绍兴市', hp: 8932},
      {name: '湖州市', hp: 4453},
      {name: '嘉兴市', hp: 7851},
      {name: '金华市', hp: 7313},
      {name: '衢州市', hp: 2402},
      {name: '台州市', hp: 7006},
      {name: '丽水市', hp: 2301},
      {name: '舟山市', hp: 2346}
    ];

    const 安徽省 = [
      {name: '合肥市', hp: 14210},
      {name: '芜湖市', hp: 5403},
      {name: '蚌埠市', hp: 2421},
      {name: '淮南市', hp: 1750},
      {name: '马鞍山市', hp: 2921},
      {name: '淮北市', hp: 1419},
      {name: '铜陵市', hp: 1415},
      {name: '安庆市', hp: 3306},
      {name: '黄山市', hp: 1205},
      {name: '阜阳市', hp: 3778},
      {name: '宿州市', hp: 2538},
      {name: '滁州市', hp: 4221},
      {name: '六安市', hp: 2407},
      {name: '宣城市', hp: 2149},
      {name: '池州市', hp: 1225},
      {name: '亳州市', hp: 2621}
    ];

    const 江西省 = [
      {name: '南昌市', hp: 8142},
      {name: '赣州市', hp: 5221},
      {name: '宜春市', hp: 3930},
      {name: '吉安市', hp: 3106},
      {name: '上饶市', hp: 3936},
      {name: '抚州市', hp: 2298},
      {name: '九江市', hp: 4247},
      {name: '景德镇市', hp: 1190},
      {name: '萍乡市', hp: 1276},
      {name: '新余市', hp: 1216},
      {name: '鹰潭市', hp: 1459}
    ];

    const 福建省 = [
      {name: '福州市', hp: 14237},
      {name: '莆田市', hp: 3580},
      {name: '泉州市', hp: 13095},
      {name: '厦门市', hp: 8980},
      {name: '漳州市', hp: 6154},
      {name: '龙岩市', hp: 3419},
      {name: '三明市', hp: 2923},
      {name: '南平市', hp: 2190},
      {name: '宁德市', hp: 4252}
    ];

    const 山东省 = [
      {name: '济南市', hp: 14210},
      {name: '青岛市', hp: 17561},
      {name: '淄博市', hp: 5089},
      {name: '枣庄市', hp: 2386},
      {name: '东营市', hp: 4308},
      {name: '烟台市', hp: 10783},
      {name: '潍坊市', hp: 8203},
      {name: '济宁市', hp: 6128},
      {name: '泰安市', hp: 3804},
      {name: '威海市', hp: 3729},
      {name: '日照市', hp: 2690},
      {name: '滨州市', hp: 3558},
      {name: '德州市', hp: 4048},
      {name: '聊城市', hp: 3304},
      {name: '临沂市', hp: 6862},
      {name: '菏泽市', hp: 4803}
    ];

    const 河南省 = [
      {name: '郑州市', hp: 14532},
      {name: '开封市', hp: 2860},
      {name: '洛阳市', hp: 6165},
      {name: '平顶山市', hp: 2929},
      {name: '安阳市', hp: 2766},
      {name: '鹤壁市', hp: 1144},
      {name: '新乡市', hp: 3687},
      {name: '焦作市', hp: 2480},
      {name: '濮阳市', hp: 2106},
      {name: '许昌市', hp: 3583},
      {name: '漯河市', hp: 1954},
      {name: '三门峡市', hp: 1703},
      {name: '商丘市', hp: 3475},
      {name: '周口市', hp: 3811},
      {name: '驻马店市', hp: 3502},
      {name: '南阳市', hp: 5168},
      {name: '信阳市', hp: 3197},
      {name: '济源市', hp: 808}
    ];

    const 湖北省 = [
      {name: '武汉市', hp: 22147},
      {name: '黄石市', hp: 2430},
      {name: '十堰市', hp: 2705},
      {name: '荆州市', hp: 3712},
      {name: '宜昌市', hp: 6191},
      {name: '襄阳市', hp: 6102},
      {name: '鄂州市', hp: 1416},
      {name: '荆门市', hp: 2602},
      {name: '黄冈市', hp: 3034},
      {name: '孝感市', hp: 3259},
      {name: '咸宁市', hp: 1945},
      {name: '仙桃市', hp: 1191},
      {name: '潜江市', hp: 952},
      {name: '神农架林区', hp: 49},
      {name: '恩施州', hp: 1742},
      {name: '天门市', hp: 785},
      {name: '随州市', hp: 1503}
    ];

    const 湖南省 = [
      {name: '长沙市', hp: 15738},
      {name: '株洲市', hp: 4063},
      {name: '湘潭市', hp: 2957},
      {name: '衡阳市', hp: 4690},
      {name: '邵阳市', hp: 2926},
      {name: '岳阳市', hp: 5387},
      {name: '张家界市', hp: 654},
      {name: '益阳市', hp: 2381},
      {name: '常德市', hp: 4533},
      {name: '娄底市', hp: 2237},
      {name: '郴州市', hp: 3328},
      {name: '永州市', hp: 2693},
      {name: '怀化市', hp: 2192},
      {name: '湘西州', hp: 856}
    ];

    const 广东省 = [
      {name: '广州市', hp: 32039},
      {name: '深圳市', hp: 38732},
      {name: '珠海市', hp: 4573},
      {name: '汕头市', hp: 3168},
      {name: '佛山市', hp: 13362},
      {name: '韶关市', hp: 1648},
      {name: '湛江市', hp: 3953},
      {name: '肇庆市', hp: 2975},
      {name: '江门市', hp: 4210},
      {name: '茂名市', hp: 4702},
      {name: '惠州市', hp: 6364},
      {name: '梅州市', hp: 1583},
      {name: '汕尾市', hp: 1546},
      {name: '河源市', hp: 1435},
      {name: '阳江市', hp: 1630},
      {name: '清远市', hp: 2317},
      {name: '东莞市', hp: 12760},
      {name: '中山市', hp: 4261},
      {name: '潮州市', hp: 1452},
      {name: '揭阳市', hp: 2530},
      {name: '云浮市', hp: 1345}
    ];

    const 广西壮族自治区 = [
      {name: '南宁市', hp: 5995},
      {name: '柳州市', hp: 3097},
      {name: '桂林市', hp: 2580},
      {name: '梧州市', hp: 1720},
      {name: '北海市', hp: 1974},
      {name: '崇左市', hp: 1359},
      {name: '来宾市', hp: 1050},
      {name: '贵港市', hp: 1628},
      {name: '贺州市', hp: 1007},
      {name: '玉林市', hp: 2437},
      {name: '百色市', hp: 2101},
      {name: '河池市', hp: 1454},
      {name: '钦州市', hp: 1908},
      {name: '防城港市', hp: 1201}
    ];

    const 海南省 = [
      {name: '海口市', hp: 2563},
      {name: '三亚市', hp: 1034},
      {name: '三沙市', hp: 6},
      {name: '琼海市', hp: 387},
      {name: '文昌市', hp: 376},
      {name: '万宁市', hp: 353},
      {name: '定安县', hp: 140},
      {name: '屯昌县', hp: 116},
      {name: '澄迈县', hp: 560},
      {name: '临高县', hp: 268},
      {name: '五指山市', hp: 52},
      {name: '东方市', hp: 285},
      {name: '白沙县', hp: 72},
      {name: '昌江县', hp: 166},
      {name: '乐东县', hp: 234},
      {name: '陵水县', hp: 288},
      {name: '保亭县', hp: 89},
      {name: '琼中县', hp: 89},
      {name: '儋州市', hp: 1037}
    ];

    const 四川省 = [
      {name: '成都市', hp: 24764},
      {name: '绵阳市', hp: 4601},
      {name: '自贡市', hp: 2003},
      {name: '攀枝花市', hp: 1410},
      {name: '泸州市', hp: 3004},
      {name: '德阳市', hp: 3387},
      {name: '广元市', hp: 1349},
      {name: '遂宁市', hp: 2002},
      {name: '内江市', hp: 2051},
      {name: '乐山市', hp: 2502},
      {name: '资阳市', hp: 1151},
      {name: '宜宾市', hp: 4135},
      {name: '南充市', hp: 2902},
      {name: '达州市', hp: 2991},
      {name: '雅安市', hp: 1132},
      {name: '阿坝州', hp: 601},
      {name: '甘孜州', hp: 613},
      {name: '凉山州', hp: 2606},
      {name: '广安市', hp: 1701},
      {name: '巴中市', hp: 917},
      {name: '眉山市', hp: 2009}
    ];

    const 贵州省 = [
      {name: '贵阳市', hp: 6038},
      {name: '六盘水市', hp: 1778},
      {name: '遵义市', hp: 5206},
      {name: '铜仁市', hp: 1723},
      {name: '黔西南州', hp: 1535},
      {name: '毕节市', hp: 2541},
      {name: '安顺市', hp: 1232},
      {name: '黔东南州', hp: 1500},
      {name: '黔南州', hp: 2008}
    ];

    const 云南省 = [
      {name: '昆明市', hp: 8637},
      {name: '昭通市', hp: 2103}, 
      {name: '曲靖市', hp: 3778},
      {name: '楚雄州', hp: 2040},
      {name: '玉溪市', hp: 2688},
      {name: '红河州', hp: 3155},
      {name: '文山州', hp: 1633},
      {name: '普洱市', hp: 1252},
      {name: '西双版纳州', hp: 941},
      {name: '大理州', hp: 2088},
      {name: '保山市', hp: 1347},
      {name: '德宏州', hp: 648},
      {name: '丽江市', hp: 744},
      {name: '怒江州', hp: 289},
      {name: '迪庆州', hp: 317},
      {name: '临沧市', hp: 1128}
    ];

    const 西藏自治区 = [
      {name: '拉萨市', hp: 990},
      {name: '昌都市', hp: 386},
      {name: '山南市', hp: 304},
      {name: '日喀则市', hp: 464},
      {name: '那曲市', hp: 246},
      {name: '阿里地区', hp: 106},
      {name: '林芝市', hp: 268}
    ];

    const 陕西省 = [
      {name: '西安市', hp: 13903},
      {name: '铜川市', hp: 607},
      {name: '宝鸡市', hp: 2649},
      {name: '咸阳市', hp: 3105},
      {name: '渭南市', hp: 2232},
      {name: '汉中市', hp: 1910},
      {name: '安康市', hp: 1141},
      {name: '商洛市', hp: 780},
      {name: '延安市', hp: 2372},
      {name: '榆林市', hp: 7549}
    ];

    const 甘肃省 = [
      {name: '兰州市', hp: 3742},
      {name: '嘉峪关市', hp: 391},
      {name: '金昌市', hp: 620},
      {name: '白银市', hp: 789},
      {name: '天水市', hp: 952},
      {name: '酒泉市', hp: 1104},
      {name: '张掖市', hp: 734},
      {name: '武威市', hp: 802},
      {name: '定西市', hp: 794},
      {name: '陇南市', hp: 716},
      {name: '平凉市', hp: 755},
      {name: '庆阳市', hp: 1213},
      {name: '临夏州', hp: 547},
      {name: '甘南州', hp: 276}
    ];

    const 宁夏回族自治区 = [
      {name: '银川市', hp: 3034},
      {name: '石嘴山市', hp: 580},
      {name: '吴忠市', hp: 962},
      {name: '固原市', hp: 488},
      {name: '中卫市', hp: 633}
    ];

    const 青海省 = [
      {name: '西宁市', hp: 1915},
      {name: '海东市', hp: 605},
      {name: '海北州', hp: 123},
      {name: '黄南州', hp: 124},
      {name: '海南州', hp: 246},
      {name: '果洛州', hp: 73},
      {name: '玉树州', hp: 92},
      {name: '海西州', hp: 917}
    ];

    const 新疆维吾尔自治区 = [
      {name: '乌鲁木齐市', hp: 4502},
      {name: '昌吉州', hp: 2638},
      {name: '石河子市', hp: 532},
      {name: '博尔塔拉州', hp: 540},
      {name: '伊犁州', hp: 1807},
      {name: '塔城地区', hp: 999},
      {name: '阿勒泰地区', hp: 465},
      {name: '克拉玛依市', hp: 1304},
      {name: '吐鲁番市', hp: 640},
      {name: '哈密市', hp: 1163},
      {name: '巴音郭楞州', hp: 1692},
      {name: '阿克苏地区', hp: 2043},
      {name: '克孜勒苏州', hp: 257},
      {name: '喀什地区', hp: 1752},
      {name: '和田地区', hp: 598}
    ];

    const 台湾省 = [
      {name: '台北市', hp: 7906},
      {name: '桃园市', hp: 5954},
      {name: '嘉义市', hp: 643},
      {name: '新北市', hp: 10288},
      {name: '基隆市', hp: 673},
      {name: '台南市', hp: 3885},
      {name: '台中市', hp: 7040},
      {name: '新竹市', hp: 1481},
      {name: '高雄市', hp: 6464},
      {name: '南投县', hp: 842},
      {name: '彰化县', hp: 2296},
      {name: '新竹县', hp: 1995},
      {name: '澎湖县', hp: 169},
      {name: '台东县', hp: 334},
      {name: '宜兰县', hp: 851},
      {name: '屏东县', hp: 1458},
      {name: '嘉义县', hp: 789},
      {name: '云林县', hp: 1233},
      {name: '花莲县', hp: 567},
      {name: '苗栗县', hp: 1260}
    ];

    // 省份映射和数据（先定义PROVINCES用于添加province字段）
    const PROVINCE_MAP = {};
    const PROVINCES = [
      { name: '直辖市和特区', cities: 直辖市和特区 },
      { name: '河北省', cities: 河北省 },
      { name: '山西省', cities: 山西省 },
      { name: '内蒙古自治区', cities: 内蒙古自治区 },
      { name: '辽宁省', cities: 辽宁省 },
      { name: '吉林省', cities: 吉林省 },
      { name: '黑龙江省', cities: 黑龙江省 },
      { name: '江苏省', cities: 江苏省 },
      { name: '浙江省', cities: 浙江省 },
      { name: '安徽省', cities: 安徽省 },
      { name: '福建省', cities: 福建省 },
      { name: '江西省', cities: 江西省 },
      { name: '山东省', cities: 山东省 },
      { name: '河南省', cities: 河南省 },
      { name: '湖北省', cities: 湖北省 },
      { name: '湖南省', cities: 湖南省 },
      { name: '广东省', cities: 广东省 },
      { name: '广西壮族自治区', cities: 广西壮族自治区 },
      { name: '海南省', cities: 海南省 },
      { name: '四川省', cities: 四川省 },
      { name: '贵州省', cities: 贵州省 },
      { name: '云南省', cities: 云南省 },
      { name: '西藏自治区', cities: 西藏自治区 },
      { name: '陕西省', cities: 陕西省 },
      { name: '甘肃省', cities: 甘肃省 },
      { name: '青海省', cities: 青海省 },
      { name: '宁夏回族自治区', cities: 宁夏回族自治区 },
      { name: '新疆维吾尔自治区', cities: 新疆维吾尔自治区 },
      { name: '台湾省', cities: 台湾省 }
    ];

    // 建立映射并为城市添加province字段
    for (const province of PROVINCES) {
      for (const city of province.cities) {
        PROVINCE_MAP[city.name] = province;
        // 关键修复：为每个城市对象添加province字段
        city.province = province.name;
        // 添加isCapital标记（省会/首府通常是数组第一个城市）
        city.isCapital = province.cities[0] === city;
        // 直辖市特殊处理
        if (province.name === '直辖市和特区') {
          city.isCapital = true;
        }
      }
    }

    // 合并所有城市数据为一个大池（此时城市已包含province字段）
    const ALL_CITIES = [
      ...直辖市和特区, ...河北省, ...山西省, ...内蒙古自治区,
      ...辽宁省, ...吉林省, ...黑龙江省, ...江苏省, ...浙江省,
      ...安徽省, ...福建省, ...江西省, ...山东省, ...河南省,
      ...湖北省, ...湖南省, ...广东省, ...广西壮族自治区, ...海南省,
      ...四川省, ...贵州省, ...云南省, ...西藏自治区, ...陕西省,
      ...甘肃省, ...青海省, ...宁夏回族自治区, ...新疆维吾尔自治区, ...台湾省
    ];

// 导出数据
export { ALL_CITIES, DEFAULT_NAMES, PROVINCES, PROVINCE_MAP };
export const cities = ALL_CITIES;

/**
 * 获取按省份分组的所有城市
 * @returns {Object} 以省份名为键，城市数组为值的对象
 */
export function getAllCitiesGroupedByProvince() {
  const result = {}
  for (const province of PROVINCES) {
    result[province.name] = province.cities
  }
  return result
}

