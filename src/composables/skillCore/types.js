/**
 * 技能系统 TypeScript 类型定义（使用 JSDoc）
 * Skill System TypeScript Type Definitions (using JSDoc)
 */

/**
 * @typedef {Object} Player
 * @property {string} name - 玩家名称
 * @property {number} gold - 金币数量
 * @property {City[]} cities - 城市列表
 * @property {number} centerIndex - 中心城市索引
 * @property {BattleModifier[]} [battleModifiers] - 战斗修饰符
 * @property {number} [team] - 队伍编号（2v2模式）
 */

/**
 * @typedef {Object} City
 * @property {string} name - 城市名称
 * @property {number} hp - 最大HP
 * @property {number} currentHp - 当前HP
 * @property {number} [baseHp] - 基础HP
 * @property {boolean} isAlive - 是否存活
 * @property {boolean} [isCenter] - 是否为中心城市
 * @property {number} [red] - 红色技能等级
 * @property {number} [green] - 绿色技能等级
 * @property {number} [blue] - 蓝色技能等级
 * @property {number} [yellow] - 黄色技能等级
 * @property {string} [province] - 所属省份
 */

/**
 * @typedef {Object} BattleModifier
 * @property {string} type - 修饰符类型
 * @property {*} value - 修饰符数值
 * @property {number} duration - 持续回合数
 * @property {string} [source] - 来源玩家
 */

/**
 * @typedef {Object} SkillResult
 * @property {boolean} success - 技能是否成功执行
 * @property {string} message - 提示消息
 * @property {*} [data] - 可选的额外数据
 * @property {StateChanges} [stateChanges] - 状态变化描述
 */

/**
 * @typedef {Object} StateChanges
 * @property {Object.<string, number>} [playerGoldUpdates] - 玩家金币更新
 * @property {Object.<string, Object.<number, CityUpdate>>} [cityHpUpdates] - 城市HP更新
 * @property {CityTransfer[]} [cityTransfers] - 城市转移
 * @property {Object.<string, Object.<number, ProtectionUpdate>>} [protectionUpdates] - 保护状态更新
 * @property {Object} [globalEffects] - 全局效果标记
 * @property {Object} [skillStateUpdates] - 技能状态更新
 * @property {LogEntry[]} [logs] - 日志条目
 */

/**
 * @typedef {Object} CityUpdate
 * @property {number} [currentHp] - 新的当前HP
 * @property {number} [baseHp] - 新的基础HP
 * @property {boolean} [isAlive] - 新的存活状态
 */

/**
 * @typedef {Object} CityTransfer
 * @property {string} from - 来源玩家
 * @property {number} fromIdx - 来源城市索引
 * @property {string} to - 目标玩家
 * @property {number} toIdx - 目标城市索引
 */

/**
 * @typedef {Object} ProtectionUpdate
 * @property {number} rounds - 保护回合数
 * @property {'normal'|'iron'} type - 保护类型
 */

/**
 * @typedef {Object} LogEntry
 * @property {string} message - 日志消息
 * @property {boolean} [isPrivate] - 是否为私有日志
 * @property {string} [targetPlayer] - 目标玩家（私有日志）
 */

/**
 * @typedef {Object} SkillParams
 * @property {Player} caster - 施法者
 * @property {Player} [target] - 目标玩家
 * @property {number} [cityIdx] - 城市索引
 * @property {number} [targetCityIdx] - 目标城市索引
 * @property {Object} gameStore - 游戏状态存储
 * @property {string} [gameMode] - 游戏模式（'2P', '3P', '2v2'）
 * @property {*} [additionalParams] - 额外参数
 */

/**
 * @typedef {Object} GameState
 * @property {Player[]} players - 玩家列表
 * @property {number} currentRound - 当前回合
 * @property {string} gameMode - 游戏模式
 * @property {Object.<string, Object.<number, number>>} protections - 保护状态
 * @property {Object.<string, Object.<number, number>>} ironCities - 钢铁城市
 * @property {Object} [jianbukecui] - 坚不可摧护盾
 * @property {Object} [barrier] - 屏障
 * @property {Object} [changeFlagMark] - 拔旗易帜标记
 */

export {}
