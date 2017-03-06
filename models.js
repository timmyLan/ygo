/**
 * Created by llan on 2017/3/2.
 */
const Sequelize = require('sequelize');
let sequelize = new Sequelize('ygo', 'root', '');
let Magic = sequelize.define('magic', {
    type: Sequelize.STRING,
    effect: Sequelize.STRING,
    JapanName: Sequelize.STRING,
    cnName: Sequelize.STRING,
    enName: Sequelize.STRING,
    limit: Sequelize.STRING,
    exclusive: Sequelize.STRING,
    rare: Sequelize.STRING,
    cardPack: Sequelize.STRING,
    carId: Sequelize.STRING,
    keyCode: Sequelize.INTEGER
});
let Trap = sequelize.define('trap', {
    type: Sequelize.STRING,
    effect: Sequelize.STRING,
    JapanName: Sequelize.STRING,
    cnName: Sequelize.STRING,
    enName: Sequelize.STRING,
    limit: Sequelize.STRING,
    exclusive: Sequelize.STRING,
    rare: Sequelize.STRING,
    cardPack: Sequelize.STRING,
    carId: Sequelize.STRING,
    keyCode: Sequelize.INTEGER
});
let Monster = sequelize.define('monster', {
    type: Sequelize.STRING,
    effect: Sequelize.STRING,
    JapanName: Sequelize.STRING,
    cnName: Sequelize.STRING,
    enName: Sequelize.STRING,
    limit: Sequelize.STRING,
    exclusive: Sequelize.STRING,
    rare: Sequelize.STRING,
    cardPack: Sequelize.STRING,
    carId: Sequelize.STRING,
    keyCode: Sequelize.INTEGER,
    tribe: Sequelize.STRING,
    element: Sequelize.STRING,
    star: Sequelize.INTEGER,
    atk: Sequelize.INTEGER,
    def: Sequelize.INTEGER,
    scale: Sequelize.STRING,
    scaleEffect: Sequelize.STRING
});

module.exports = {
    sequelize: sequelize,
    Magic: Magic,
    Trap: Trap,
    Monster: Monster
};
