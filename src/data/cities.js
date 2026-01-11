/**
 * 城市卡牌游戏 - 城市数据模块
 * 包含中国所有省份的城市信息和玩家默认名称
 */

// 默认玩家名称
const DEFAULT_NAMES = ['Whale','CRH380BL-3562','Sirius North','猎奇凤爱莉'];

// 省份城市数据

    const 直辖市和特区 = [
      {name: '北京市', hp: 49843},
      {name: '上海市', hp: 53927},
      {name: '天津市', hp: 18024},
      {name: '重庆市', hp: 32193},
      {name: '香港特别行政区', hp: 28911},
      {name: '澳门特别行政区', hp: 3572},
    ];

    const 河北省 = [
      {name: '石家庄市', hp: 8203},
      {name: '唐山市', hp: 10004},
      {name: '秦皇岛市', hp: 2121},
      {name: '邯郸市', hp: 4704},
      {name: '邢台市', hp: 2766},
      {name: '保定市', hp: 4773},
      {name: '张家口市', hp: 1913},
      {name: '承德市', hp: 1963},
      {name: '沧州市', hp: 4723},
      {name: '廊坊市', hp: 3904},
      {name: '衡水市', hp: 1972},
      {name: '雄安新区', hp: 621}
    ];

    const 山西省 = [
      {name: '太原市', hp: 5419},
      {name: '大同市', hp: 1803},
      {name: '阳泉市', hp: 856},
      {name: '长治市', hp: 2593},
      {name: '晋城市', hp: 2410},
      {name: '朔州市', hp: 1329},
      {name: '忻州市', hp: 1343},
      {name: '吕梁市', hp: 2643},
      {name: '晋中市', hp: 2459},
      {name: '临汾市', hp: 2439},
      {name: '运城市', hp: 2191}
    ];

    const 内蒙古自治区 = [
      {name: '呼和浩特市', hp: 4107},
      {name: '包头市', hp: 4575},
      {name: '乌海市', hp: 596},
      {name: '赤峰市', hp: 2322},
      {name: '呼伦贝尔市', hp: 1730},
      {name: '兴安盟', hp: 808},
      {name: '通辽市', hp: 1686},
      {name: '锡林郭勒盟', hp: 1236},
      {name: '乌兰察布市', hp: 1214},
      {name: '鄂尔多斯市', hp: 6363},
      {name: '巴彦淖尔市', hp: 1242},
      {name: '阿拉善盟', hp: 414}
];

    const 辽宁省 = [
      {name: '沈阳市', hp: 9027},
      {name: '大连市', hp: 9517},
      {name: '鞍山市', hp: 2156},
      {name: '抚顺市', hp: 1011},
      {name: '本溪市', hp: 1026},
      {name: '丹东市', hp: 1008},
      {name: '锦州市', hp: 1354},
      {name: '营口市', hp: 1560},
      {name: '阜新市', hp: 650},
      {name: '辽阳市', hp: 953},
      {name: '盘锦市', hp: 1414},
      {name: '铁岭市', hp: 779},
      {name: '朝阳市', hp: 1153},
      {name: '葫芦岛市', hp: 1004}
    ];

    const 吉林省 = [
      {name: '长春市', hp: 7632},
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
      {name: '哈尔滨市', hp: 6016},
      {name: '齐齐哈尔市', hp: 1353},
      {name: '牡丹江市', hp: 1051},
      {name: '佳木斯市', hp: 1008},
      {name: '大庆市', hp: 2816},
      {name: '伊春市', hp: 370},
      {name: '鸡西市', hp: 623},
      {name: '鹤岗市', hp: 376},
      {name: '双鸭山市', hp: 557},
      {name: '七台河市', hp: 237},
      {name: '绥化市', hp: 1244},
      {name: '黑河市', hp: 711},
      {name: '大兴安岭地区', hp: 173}
    ];

    const 江苏省 = [
      {name: '南京市', hp: 18501},
      {name: '无锡市', hp: 16263},
      {name: '徐州市', hp: 9537},
      {name: '常州市', hp: 10814},
      {name: '苏州市', hp: 26727},
      {name: '南通市', hp: 12422},
      {name: '连云港市', hp: 4663},
      {name: '淮安市', hp: 5413},
      {name: '盐城市', hp: 7779},
      {name: '扬州市', hp: 7810},
      {name: '镇江市', hp: 5540},
      {name: '泰州市', hp: 7021},
      {name: '宿迁市', hp: 4802}
    ];

    const 浙江省 = [
      {name: '杭州市', hp: 21860},
      {name: '宁波市', hp: 18148},
      {name: '温州市', hp: 9719},
      {name: '绍兴市', hp: 8369},
      {name: '湖州市', hp: 4213},
      {name: '嘉兴市', hp: 7570},
      {name: '金华市', hp: 6926},
      {name: '衢州市', hp: 2263},
      {name: '台州市', hp: 6656},
      {name: '丽水市', hp: 2181},
      {name: '舟山市', hp: 2226}
    ];

    const 安徽省 = [
      {name: '合肥市', hp: 13508},
      {name: '芜湖市', hp: 5121},
      {name: '蚌埠市', hp: 2313},
      {name: '淮南市', hp: 1716},
      {name: '马鞍山市', hp: 2785},
      {name: '淮北市', hp: 1406},
      {name: '铜陵市', hp: 1326},
      {name: '安庆市', hp: 3156},
      {name: '黄山市', hp: 1134},
      {name: '阜阳市', hp: 3610},
      {name: '宿州市', hp: 2457},
      {name: '滁州市', hp: 4034},
      {name: '六安市', hp: 2408},
      {name: '宣城市', hp: 2054},
      {name: '池州市', hp: 1178},
      {name: '亳州市', hp: 2522}
    ];

    const 江西省 = [
      {name: '南昌市', hp: 7800},
      {name: '赣州市', hp: 4940},
      {name: '宜春市', hp: 3711},
      {name: '吉安市', hp: 2917},
      {name: '上饶市', hp: 3721},
      {name: '抚州市', hp: 2173},
      {name: '九江市', hp: 4022},
      {name: '景德镇市', hp: 1179},
      {name: '萍乡市', hp: 1211},
      {name: '新余市', hp: 1143},
      {name: '鹰潭市', hp: 1302}
    ];

    const 福建省 = [
      {name: '福州市', hp: 14237},
      {name: '莆田市', hp: 3443},
      {name: '泉州市', hp: 13095},
      {name: '厦门市', hp: 8589},
      {name: '漳州市', hp: 6064},
      {name: '龙岩市', hp: 3419},
      {name: '三明市', hp: 2923},
      {name: '南平市', hp: 2090},
      {name: '宁德市', hp: 3902}
    ];

    const 山东省 = [
      {name: '济南市', hp: 13528},
      {name: '青岛市', hp: 16719},
      {name: '淄博市', hp: 4884},
      {name: '枣庄市', hp: 2386},
      {name: '东营市', hp: 4308},
      {name: '烟台市', hp: 10783},
      {name: '潍坊市', hp: 8203},
      {name: '济宁市', hp: 5867},
      {name: '泰安市', hp: 3622},
      {name: '威海市', hp: 3729},
      {name: '日照市', hp: 2557},
      {name: '滨州市', hp: 3405},
      {name: '德州市', hp: 4048},
      {name: '聊城市', hp: 3168},
      {name: '临沂市', hp: 6556},
      {name: '菏泽市', hp: 4803}
    ];

    const 河南省 = [
      {name: '郑州市', hp: 14532},
      {name: '开封市', hp: 2761},
      {name: '洛阳市', hp: 5819},
      {name: '平顶山市', hp: 2832},
      {name: '安阳市', hp: 2672},
      {name: '鹤壁市', hp: 1094},
      {name: '新乡市', hp: 3570},
      {name: '焦作市', hp: 2369},
      {name: '濮阳市', hp: 2019},
      {name: '许昌市', hp: 3441},
      {name: '漯河市', hp: 1870},
      {name: '三门峡市', hp: 1619},
      {name: '商丘市', hp: 3272},
      {name: '周口市', hp: 3636},
      {name: '驻马店市', hp: 3343},
      {name: '南阳市', hp: 4879},
      {name: '信阳市', hp: 3073},
      {name: '济源市', hp: 790}
    ];

    const 湖北省 = [
      {name: '武汉市', hp: 21106},
      {name: '黄石市', hp: 2306},
      {name: '十堰市', hp: 2566},
      {name: '荆州市', hp: 3506},
      {name: '宜昌市', hp: 6191},
      {name: '襄阳市', hp: 6102},
      {name: '鄂州市', hp: 1341},
      {name: '荆门市', hp: 2460},
      {name: '黄冈市', hp: 3217},
      {name: '孝感市', hp: 3259},
      {name: '咸宁市', hp: 1945},
      {name: '仙桃市', hp: 1125},
      {name: '潜江市', hp: 952},
      {name: '神农架林区', hp: 49},
      {name: '恩施州', hp: 1661},
      {name: '天门市', hp: 785},
      {name: '随州市', hp: 1442}
    ];

    const 湖南省 = [
      {name: '长沙市', hp: 15269},
      {name: '株洲市', hp: 3902},
      {name: '湘潭市', hp: 2957},
      {name: '衡阳市', hp: 4492},
      {name: '邵阳市', hp: 2926},
      {name: '岳阳市', hp: 5128},
      {name: '张家界市', hp: 654},
      {name: '益阳市', hp: 2268},
      {name: '常德市', hp: 4533},
      {name: '娄底市', hp: 2132},
      {name: '郴州市', hp: 3328},
      {name: '永州市', hp: 2693},
      {name: '怀化市', hp: 2094},
      {name: '湘西州', hp: 856}
    ];

    const 广东省 = [
      {name: '广州市', hp: 31033},
      {name: '深圳市', hp: 36802},
      {name: '珠海市', hp: 4479},
      {name: '汕头市', hp: 3168},
      {name: '佛山市', hp: 13362},
      {name: '韶关市', hp: 1648},
      {name: '湛江市', hp: 3840},
      {name: '肇庆市', hp: 2918},
      {name: '江门市', hp: 4210},
      {name: '茂名市', hp: 4702},
      {name: '惠州市', hp: 6136},
      {name: '梅州市', hp: 1508},
      {name: '汕尾市', hp: 1501},
      {name: '河源市', hp: 1408},
      {name: '阳江市', hp: 1630},
      {name: '清远市', hp: 2253},
      {name: '东莞市', hp: 12282},
      {name: '中山市', hp: 4143},
      {name: '潮州市', hp: 1403},
      {name: '揭阳市', hp: 2530},
      {name: '云浮市', hp: 1309}
    ];

    const 广西壮族自治区 = [
      {name: '南宁市', hp: 5995},
      {name: '柳州市', hp: 2951},
      {name: '桂林市', hp: 2517},
      {name: '梧州市', hp: 1622},
      {name: '北海市', hp: 1888},
      {name: '崇左市', hp: 1313},
      {name: '来宾市', hp: 1030},
      {name: '贵港市', hp: 1566},
      {name: '贺州市', hp: 964},
      {name: '玉林市', hp: 2347},
      {name: '百色市', hp: 2005},
      {name: '河池市', hp: 1404},
      {name: '钦州市', hp: 1879},
      {name: '防城港市', hp: 1168}
    ];

    const 海南省 = [
      {name: '海口市', hp: 2471},
      {name: '三亚市', hp: 1005},
      {name: '三沙市', hp: 6},
      {name: '琼海市', hp: 389},
      {name: '文昌市', hp: 393},
      {name: '万宁市', hp: 353},
      {name: '定安县', hp: 140},
      {name: '屯昌县', hp: 116},
      {name: '澄迈县', hp: 551},
      {name: '临高县', hp: 261},
      {name: '五指山市', hp: 49},
      {name: '东方市', hp: 272},
      {name: '白沙县', hp: 72},
      {name: '昌江县', hp: 165},
      {name: '乐东县', hp: 228},
      {name: '陵水县', hp: 275},
      {name: '保亭县', hp: 87},
      {name: '琼中县', hp: 89},
      {name: '儋州市', hp: 1013}
    ];

    const 四川省 = [
      {name: '成都市', hp: 23511},
      {name: '绵阳市', hp: 4344},
      {name: '自贡市', hp: 1876},
      {name: '攀枝花市', hp: 1395},
      {name: '泸州市', hp: 2837},
      {name: '德阳市', hp: 3265},
      {name: '广元市', hp: 1279},
      {name: '遂宁市', hp: 1870},
      {name: '内江市', hp: 1943},
      {name: '乐山市', hp: 2533},
      {name: '资阳市', hp: 1090},
      {name: '宜宾市', hp: 4006},
      {name: '南充市', hp: 2862},
      {name: '达州市', hp: 2802},
      {name: '雅安市', hp: 1083},
      {name: '阿坝州', hp: 570},
      {name: '甘孜州', hp: 581},
      {name: '凉山州', hp: 2475},
      {name: '广安市', hp: 1616},
      {name: '巴中市', hp: 871},
      {name: '眉山市', hp: 1890}
    ];

    const 贵州省 = [
      {name: '贵阳市', hp: 5777},
      {name: '六盘水市', hp: 1711},
      {name: '遵义市', hp: 5027},
      {name: '铜仁市', hp: 1650},
      {name: '黔西南州', hp: 1479},
      {name: '毕节市', hp: 2458},
      {name: '安顺市', hp: 1186},
      {name: '黔东南州', hp: 1432},
      {name: '黔南州', hp: 1947}
    ];

    const 云南省 = [
      {name: '昆明市', hp: 8275},
      {name: '昭通市', hp: 2017}, 
      {name: '曲靖市', hp: 3677},
      {name: '楚雄州', hp: 2019},
      {name: '玉溪市', hp: 2582},
      {name: '红河州', hp: 2985},
      {name: '文山州', hp: 1549},
      {name: '普洱市', hp: 1189},
      {name: '西双版纳州', hp: 902},
      {name: '大理州', hp: 2011},
      {name: '保山市', hp: 1822},
      {name: '德宏州', hp: 620},
      {name: '丽江市', hp: 710},
      {name: '怒江州', hp: 279},
      {name: '迪庆州', hp: 307},
      {name: '临沧市', hp: 1150}
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
      {name: '西安市', hp: 13318},
      {name: '铜川市', hp: 589},
      {name: '宝鸡市', hp: 2548},
      {name: '咸阳市', hp: 3163},
      {name: '渭南市', hp: 2158},
      {name: '汉中市', hp: 1910},
      {name: '安康市', hp: 1141},
      {name: '商洛市', hp: 780},
      {name: '延安市', hp: 2383},
      {name: '榆林市', hp: 7549}
    ];

    const 甘肃省 = [
      {name: '兰州市', hp: 3742},
      {name: '嘉峪关市', hp: 371},
      {name: '金昌市', hp: 620},
      {name: '白银市', hp: 743},
      {name: '天水市', hp: 952},
      {name: '酒泉市', hp: 1042},
      {name: '张掖市', hp: 681},
      {name: '武威市', hp: 750},
      {name: '定西市', hp: 737},
      {name: '陇南市', hp: 667},
      {name: '平凉市', hp: 723},
      {name: '庆阳市', hp: 1213},
      {name: '临夏州', hp: 506},
      {name: '甘南州', hp: 256}
    ];

    const 宁夏回族自治区 = [
      {name: '银川市', hp: 2940},
      {name: '石嘴山市', hp: 505},
      {name: '吴忠市', hp: 934},
      {name: '固原市', hp: 464},
      {name: '中卫市', hp: 600}
    ];

    const 青海省 = [
      {name: '西宁市', hp: 1862},
      {name: '海东市', hp: 605},
      {name: '海北州', hp: 116},
      {name: '黄南州', hp: 123},
      {name: '海南州', hp: 235},
      {name: '果洛州', hp: 69},
      {name: '玉树州', hp: 92},
      {name: '海西州', hp: 848}
    ];

    const 新疆维吾尔自治区 = [
      {name: '乌鲁木齐市', hp: 4502},
      {name: '昌吉州', hp: 2509},
      {name: '石河子市', hp: 532},
      {name: '博尔塔拉州', hp: 540},
      {name: '伊犁州', hp: 1807},
      {name: '塔城地区', hp: 999},
      {name: '阿勒泰地区', hp: 465},
      {name: '克拉玛依市', hp: 1327},
      {name: '吐鲁番市', hp: 640},
      {name: '哈密市', hp: 1084},
      {name: '巴音郭楞州', hp: 1692},
      {name: '阿克苏地区', hp: 1954},
      {name: '克孜勒苏州', hp: 257},
      {name: '喀什地区', hp: 1627},
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

    // 合并所有城市数据为一个大池
    const ALL_CITIES = [
      ...直辖市和特区, ...河北省, ...山西省, ...内蒙古自治区,
      ...辽宁省, ...吉林省, ...黑龙江省, ...江苏省, ...浙江省,
      ...安徽省, ...福建省, ...江西省, ...山东省, ...河南省,
      ...湖北省, ...湖南省, ...广东省, ...广西壮族自治区, ...海南省,
      ...四川省, ...贵州省, ...云南省, ...西藏自治区, ...陕西省,
      ...甘肃省, ...青海省, ...宁夏回族自治区, ...新疆维吾尔自治区, ...台湾省
    ];

    // 省份映射：城市名 -> 省份数组
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
    // 建立映射
      for (const province of PROVINCES) {
        for (const city of province.cities) {
          PROVINCE_MAP[city.name] = province;
        }
      }

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

