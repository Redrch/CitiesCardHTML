<template>
  <div
    v-if="modelValue"
    class="modal-backdrop"
  >
    <div class="modal-content">
      <div class="modal-header">
        <h2>城市介绍</h2>
        <button class="close-btn" @click="close">关闭</button>
      </div>

      <div class="modal-body">
        <!-- 搜索框 -->
        <div class="search-section">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索城市名称..."
            class="search-input"
          />
        </div>

        <!-- 省份列表 -->
        <div v-for="(cities, provinceName) in filteredProvinces" :key="provinceName">
          <h3 class="province-title">{{ provinceName }}</h3>
          <div class="cities-grid">
            <div
              v-for="city in cities"
              :key="city.name"
              class="city-info-card"
            >
              <div class="city-header">
                <span class="city-name">{{ city.name }}</span>
                <span v-if="city.isCapital" class="city-badge capital-badge">
                  {{ city.capitalType }}
                </span>
              </div>

              <div class="city-details">
                <div class="detail-row">
                  <span class="detail-label">所属：</span>
                  <span class="detail-value">{{ city.province }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">初始HP：</span>
                  <span class="detail-value hp-value">{{ city.hp.toLocaleString() }}</span>
                </div>

                <div class="detail-row skill-row">
                  <span class="detail-label">专属技能：</span>
                  <span v-if="city.skill" class="skill-name">
                    {{ city.skill.name }}
                  </span>
                  <span v-else class="no-skill">
                    暂无专属技能
                  </span>
                </div>

                <!-- 技能类型和分类标签 -->
                <div v-if="city.skill" class="skill-badges">
                  <span class="skill-type-badge" :class="`skill-type--${city.skill.type}`">
                    {{ getSkillTypeLabel(city.skill.type) }}
                  </span>
                  <span class="skill-category-badge" :class="`skill-category--${city.skill.category}`">
                    {{ getSkillCategoryLabel(city.skill.category) }}
                  </span>
                </div>

                <div v-if="city.skill" class="skill-description">
                  {{ city.skill.description }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getAllCitiesGroupedByProvince } from '../../data/cities'
import { getCitySkill, SKILL_TYPE } from '../../data/citySkills'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')

// 省会/首府/计划单列市配置
const CAPITAL_CITIES = {
  '北京市': '首都',
  '天津市': '直辖市',
  '上海市': '直辖市',
  '重庆市': '直辖市',
  '香港特别行政区': '特别行政区',
  '澳门特别行政区': '特别行政区',
  '石家庄市': '省会',
  '太原市': '省会',
  '呼和浩特市': '首府',
  '沈阳市': '省会',
  '长春市': '省会',
  '哈尔滨市': '省会',
  '南京市': '省会',
  '杭州市': '省会',
  '合肥市': '省会',
  '福州市': '省会',
  '南昌市': '省会',
  '济南市': '省会',
  '郑州市': '省会',
  '武汉市': '省会',
  '长沙市': '省会',
  '广州市': '省会',
  '南宁市': '首府',
  '海口市': '省会',
  '成都市': '省会',
  '贵阳市': '省会',
  '昆明市': '省会',
  '拉萨市': '首府',
  '西安市': '省会',
  '兰州市': '省会',
  '西宁市': '省会',
  '银川市': '首府',
  '乌鲁木齐市': '首府',
  '台北市': '省会',
  '大连市': '计划单列市',
  '宁波市': '计划单列市',
  '厦门市': '计划单列市',
  '青岛市': '计划单列市',
  '深圳市': '计划单列市'
}

/**
 * 获取所有城市信息
 */
const allCities = computed(() => {
  const provincesData = getAllCitiesGroupedByProvince()
  const result = {}

  for (const [provinceName, cities] of Object.entries(provincesData)) {
    result[provinceName] = cities.map(city => ({
      name: city.name,
      province: provinceName,
      hp: city.hp,
      isCapital: CAPITAL_CITIES.hasOwnProperty(city.name),
      capitalType: CAPITAL_CITIES[city.name] || '',
      skill: getCitySkill(city.name)
    }))
  }

  return result
})

/**
 * 根据搜索关键词过滤城市
 */
const filteredProvinces = computed(() => {
  if (!searchQuery.value.trim()) {
    return allCities.value
  }

  const query = searchQuery.value.toLowerCase()
  const result = {}

  for (const [provinceName, cities] of Object.entries(allCities.value)) {
    const filteredCities = cities.filter(city =>
      city.name.toLowerCase().includes(query) ||
      provinceName.toLowerCase().includes(query)
    )

    if (filteredCities.length > 0) {
      result[provinceName] = filteredCities
    }
  }

  return result
})

/**
 * 获取技能类型的中文标签
 */
function getSkillTypeLabel(type) {
  const typeMap = {
    [SKILL_TYPE.PASSIVE]: '被动技能',
    [SKILL_TYPE.ACTIVE]: '主动技能',
    [SKILL_TYPE.TOGGLE]: '切换技能'
  }
  return typeMap[type] || '未知类型'
}

/**
 * 获取技能分类的中文标签
 */
function getSkillCategoryLabel(category) {
  if (category === 'battle') {
    return '战斗技能'
  } else if (category === 'nonBattle') {
    return '非战斗技能'
  }
  return '未分类'
}

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
}

.modal-content {
  background: white;
  margin: 20px;
  max-width: 1200px;
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  border-radius: 8px 8px 0 0;
}

.modal-header h2 {
  margin: 0;
  color: white;
  font-size: 24px;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.search-section {
  margin-bottom: 20px;
  position: sticky;
  top: 0;
  background: white;
  padding: 10px 0;
  z-index: 10;
}

.search-input {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #ff6b6b;
}

.province-title {
  color: #ff6b6b;
  border-bottom: 2px solid #ff6b6b;
  padding-bottom: 8px;
  margin-top: 30px;
  margin-bottom: 16px;
  font-size: 20px;
}

.cities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.city-info-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.city-info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #ff6b6b;
}

.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.city-name {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.city-badge {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.capital-badge {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #333;
}

.city-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
}

.detail-label {
  color: #666;
  font-size: 14px;
  min-width: 80px;
}

.detail-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.hp-value {
  color: #4caf50;
  font-weight: bold;
}

.skill-row {
  align-items: flex-start;
}

.skill-name {
  color: #ff6b6b;
  font-weight: bold;
  font-size: 14px;
}

.no-skill {
  color: #999;
  font-style: italic;
  font-size: 14px;
}

.skill-description {
  margin-top: 8px;
  padding: 8px;
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
  border-radius: 4px;
  font-size: 13px;
  color: #555;
  line-height: 1.5;
}

/* 技能标签样式 */
.skill-badges {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.skill-type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.skill-category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
}

.skill-type--passive {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.skill-type--active {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: white;
}

.skill-type--toggle {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.skill-category--battle {
  background: linear-gradient(135deg, #f5576c, #f093fb);
  color: white;
}

.skill-category--nonBattle {
  background: linear-gradient(135deg, #38a169, #48bb78);
  color: white;
}
</style>
