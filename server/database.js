"use strict";

let config = require('./config.json');
let mysql = require('mysql');
const Sequelize = require('sequelize');
let fs = require('fs');

let pool =  mysql.createPool({
    port: config.mysql_port,
    host: config.host,
    user: config.db_user,
    password: config.db_password,
    database: config.db_name,
    multipleStatements: true
});

let createDbStructure_SQL = fs.readFileSync(__dirname +
    '/shops_online-structure.sql', { encoding : 'utf8'});
let createDbData_SQL = fs.readFileSync(__dirname +
    '/shops_online-data.sql',
    { encoding : 'utf8'});
let dropTables = `SET FOREIGN_KEY_CHECKS=0; DROP TABLE ` +
    `${config.db_name}.products,` +
    `${config.db_name}.shops`;

const connection = new Sequelize(config.db_name, config.db_user, config.db_password, {
    host: config.host,
    port: config.mysql_port,
    dialect: 'mysql',

    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        timestamps: false
    }
});

const Product = connection.define('products', {
    img_src: Sequelize.STRING,
    name: Sequelize.STRING,
    slug: Sequelize.STRING,
    price: Sequelize.INTEGER,
    old_price: Sequelize.INTEGER,
    description: Sequelize.STRING,
    shop_id: Sequelize.INTEGER,
    category_id: Sequelize.INTEGER
});

const Shop = connection.define('shops', {
    img_src: Sequelize.STRING,
    name: Sequelize.STRING,
    slug: Sequelize.STRING,
    description: Sequelize.INTEGER
});

Product.belongsTo(Shop, {foreignKey: 'shop_id'});
Shop.hasMany(Product, {foreignKey: 'shop_id'});

function getProducts(callback) {
    Product
        .all()
        .then(function (products) {
            if(!products) callback({"error": {"message": "No results"}});
            callback(products);
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

function getProductsByShopId(shop_id, callback) {
    Product
        .findAll({where: {shop_id: shop_id}})
        .then(function (products) {
            if(!products) callback({"error": {"message": "No results"}});
            callback(products)
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

function getProductById(id, callback) {
    Product
        .findOne({
            where: {id: id},
            include:
                [{ model: Shop, attributes: ['img_src', 'slug'] }],
            order: [[Shop, 'img_src']]
        })
        .then(function (products) {
            if(!products) callback({"error": {"message": "No results"}});
            callback(products)
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

function getProductBySlug(slug, callback) {
    Product
        .findOne({
            where: {slug: slug},
            include:
                [{ model: Shop, attributes: ['img_src', 'slug'] }],
            order: [[Shop, 'img_src']]
        })
        .then(function (products) {
            if(!products) callback({"error": {"message": "No results"}});
            callback(products)
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

function getShops(callback) {
    Shop
        .all()
        .then(function (shops) {
            if(!shops) callback({"error": {"message": "No results"}});
            callback(shops);
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

function getShopById(id, callback) {
    Shop
        .findOne({where: {id: id}})
        .then(function (shop) {
            if(!shop) callback({"error": {"message": "No results"}});
            callback(shop);
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}
function getShopBySlug(slug, callback) {
    Shop
        .findOne({where: {slug: slug}})
        .then(function (shop) {
            if(!shop) callback({"error": {"message": "No results"}});
            callback(shop);
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

// TODO: make it ORM
function createTablesData(callback) {
    pool.getConnection(function (err, connection) {
        if (err) callback({"error": err});
        connection.query(createDbData_SQL, function (err) {
            connection.release();
            if (err && err.code && err.code === "ER_DUP_ENTRY")
                err = {"error": "Data has been duplicated!"};
            callback(err,
                {"success": "Tables data has been created!"});
        })
    });
}

// TODO: make it ORM
function createTables(callback) {
    pool.getConnection(function (err, connection) {
        if (err) callback({"error": err});
        connection.query(createDbStructure_SQL, function (err) {
            connection.release();
            callback(err, {"success": "Tables has been created!"});
        })
    })
}

// TODO: make it ORM
function removeTables(callback) {
    pool.getConnection(function (err, connection) {
        if (err) callback({"error": err});

        connection.query(dropTables, function (err) {
            connection.release();
            callback(err, {"success": "Tables has been removed!"});
        });
    });
}

function insertJSON(insertion, callback) {
    Product
        .bulkCreate(insertion, {validate: true})
        .then(function (result) {
            callback({"success": result})
        })
        .catch(function (errors) {
            callback({"error":errors})
        })
}

module.exports = {
    getProducts: getProducts,
    getProductsByShopId: getProductsByShopId,
    getProductById: getProductById,
    getProductBySlug: getProductBySlug,
    getShops: getShops,
    getShopById: getShopById,
    getShopBySlug: getShopBySlug,
    createTablesData: createTablesData,
    createTables: createTables,
    removeTables: removeTables,
    insertJSON: insertJSON
};
