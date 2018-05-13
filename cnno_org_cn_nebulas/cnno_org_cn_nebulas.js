"use strict";

var GoodItem = function (text) {
    if (text) {
        var obj = JSON.parse(text);
        this.saler = obj.saler;
        this.title = obj.title;
        this.price = obj.price;
        this.description = obj.description;
        this.status = obj.status;
        this.timestamp = obj.timestamp;
    } else {
        this.saler = '';
        this.title = '';
        this.price = '';
        this.description = '';
        this.status = '';
        this.timestamp = '';
    }
};
GoodItem.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};

var OrderItem = function (text) {
    if (text) {
        var obj = JSON.parse(text);
        this.goodid = obj.goodid;
        this.buyer = obj.buyer;
        this.pay = obj.pay;
        this.description = obj.description;
        this.status = obj.status;
        this.closetext = obj.closetext;
        this.timestamp = obj.timestamp;
    } else {
        this.goodid = '';
        this.buyer = '';
        this.pay = '';
        this.description = '';
        this.status = '';
        this.closetext = '';
        this.timestamp = '';
    }
};
OrderItem.prototype = {
    toString: function () {
        return JSON.stringify(this);
    }
};




var CnnoContract = function () {
    LocalContractStorage.defineMapProperty(this, "GoodsMap", {
        parse: function (text) {
            return new GoodItem(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });
    LocalContractStorage.defineMapProperty(this, "OrdersMap", {
        parse: function (text) {
            return new OrderItem(text);
        },
        stringify: function (o) {
            return o.toString();
        }
    });

    LocalContractStorage.defineProperty(this, "SuperAdmin");
    LocalContractStorage.defineProperty(this, "NewOrderLock");
};

CnnoContract.prototype = {
    init: function () {
        this.SuperAdmin = 'n1Lvduf7mV6NBXwi43ahP3RqRKrnp6jHa8D';
        this.NewOrderLock = false;
        LocalContractStorage.set("Goods", {});
        LocalContractStorage.set("Orders", {});
        LocalContractStorage.set("balance", {});
        LocalContractStorage.set("OrderLogs", {});
    },

    /**
     * private function，whether it is a JS object
     * @param val
     * @returns {boolean}
     * @private
     */
    _isObject: function (val) {
        return val != null && typeof val === 'object' && Array.isArray(val) === false;
    },

    /**
     * private function ,json to array
     * @param json
     * @returns {Array}
     * @private
     */
    _json2array: function (json) {
        var arr = [];
        if (this._isObject(json)) {
            for (var i in json) {
                arr[i] = json[i];
            }
        }
        return arr;
    },

    /**
     * private function,array to json
     * @param arr
     * @private
     */
    _array2json: function (arr) {
        var json = {};
        if (Array.isArray(arr)) {
            for (var i in arr) {
                json[i] = arr[i];
            }
        }
        return json;
    },

    /**
     * private function ,return index of item
     * @param array
     * @param val
     * @returns {number}
     * @private
     */
    _indexOf: function (array, val) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == val) return i;
        }
        return -1;
    },
    /**
     * private function ,remove item from array
     * @param array
     * @param val
     * @private
     */
    _remove: function (array, val) {
        var index = this._indexOf(array, val);
        if (index > -1) {
            array.splice(index, 1);
        }
        return array;
    },

    /**
     * add a good
     * @param title
     * @param description
     * @param price
     * @returns {string}
     * @constructor
     */
    AddGoodItem: function (title, description, price) {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            if (title === "" || price === "") {
                throw new Error("必填字段不能为空");
            }
            if (title.length > 100 || isNaN(parseFloat(price))) {
                throw new Error("参数错误！")
            }
            let aGoodItem = new GoodItem();
            let timestamp = Date.now();
            aGoodItem.title = title;
            aGoodItem.price = parseFloat(price);
            aGoodItem.saler = from;
            aGoodItem.description = description;
            aGoodItem.status = "New";
            aGoodItem.timestamp = timestamp;
            let key = from + timestamp;
            this.GoodsMap.set(key, aGoodItem);

            let aGoods = LocalContractStorage.get("Goods");
            let aGoodsArr = this._json2array(aGoods);
            aGoodsArr.push(key);
            aGoods = this._array2json(aGoodsArr);
            LocalContractStorage.set("Goods", aGoods);
            return '{"result":1}';
        } else {
            throw new Error("限制访问");
        }

    },

    /**
     * delete a good
     * @param goodid
     * @returns {string}
     * @constructor
     */
    DelGoodItem: function (goodid) {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            if (this.GoodsMap.get(goodid)) {
                this.GoodsMap.del(goodid);
                let aGoods = LocalContractStorage.get("Goods");
                let aGoodsArr = this._json2array(aGoods);
                aGoodsArr = this._remove(aGoodsArr, goodid);
                aGoods = this._array2json(aGoodsArr);
                LocalContractStorage.set("Goods", aGoods);
                return '{"result":1}';
            } else {
                throw new Error("商品不存在");
            }
        } else {
            throw new Error("限制访问");
        }
    },


    /**
     * modify a good
     * @param goodid
     * @param title
     * @param description
     * @param price
     * @param status
     * @returns {string}
     * @constructor
     */

    //["n1Lvduf7mV6NBXwi43ahP3RqRKrnp6jHa8D1526216220000","罗安满","maio描述","75.9","aa"]
    ModifyGoodItem: function (goodid, title, description, price, status) {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            if (this.GoodsMap.get(goodid)) {
                if (title === "" || price === "") {
                    throw new Error("必填字段不能为空");
                }
                if (title.length > 100 || isNaN(parseFloat(price))) {
                    throw new Error("参数错误！")
                }
                let aGoodItem = new GoodItem();
                let timestamp = Date.now();
                aGoodItem.title = title;
                aGoodItem.price = parseFloat(price).toFixed(2);
                aGoodItem.saler = from;
                aGoodItem.description = description;
                aGoodItem.status = "New";
                aGoodItem.timestamp = timestamp;
                this.GoodsMap.set(goodid, aGoodItem);
                return '{"result":1}';
            } else {
                throw new Error("商品不存在");
            }
        } else {
            throw new Error("限制访问");
        }
    },

    /**
     * return goods list
     * @returns {string}
     * @constructor
     */
    GoodList: function () {
        let from = Blockchain.transaction.from;
        if (from) {
            let aGoods = LocalContractStorage.get("Goods");
            let result = [];
            for (let i in aGoods) {
                result.push(this.GoodsMap.get(aGoods[i]));
            }
            return JSON.stringify(result);
        } else {
            throw new Error("限制访问");
        }
    },

    /**
     * return good detail info
     * @param goodid
     * @returns {*}
     * @constructor
     */
    GoodInfo:function(goodid){
        let from = Blockchain.transaction.from;
        let aGoodItem = this.GoodsMap.get(goodid);
        if (aGoodItem){
            return aGoodItem;
        } else{
            throw new Error("商品不存在");
        }

    },

    /**
     * create a new order
     * @param goodid
     * @param description
     * @constructor
     */
    NewOrder: function (goodid, description) {
        if (!this.NewOrderLock) {
            this.NewOrderLock = true;
            let from = Blockchain.transaction.from;
            let value = Blockchain.transaction.value;
            let aGoodItem = this.GoodsMap.get(goodid);
            if (aGoodItem) {
                let aPrice = aGoodItem.price;
                let amount = new BigNumber(aPrice * 1000000000000000000);
                if (value.lt(amount)) {
                    throw new Error("不能低于商品价格，你需要支付" + aPrice + "NAS");
                }
                let aOrderItem = new OrderItem();
                let timestamp = Date.now();
                aOrderItem.goodid = goodid;
                aOrderItem.buyer = from;
                aOrderItem.pay = value;
                aOrderItem.description = description;
                aOrderItem.status = "New";
                aOrderItem.closetext = '';
                aOrderItem.timestamp = timestamp;
                let key = from + "_" + timestamp;
                this.OrdersMap.set(key, aOrderItem);
                this.NewOrderLock = false;

                let aOrderLogs = LocalContractStorage.get("OrderLogs");
                let aOrderLogsArr = this._json2array(aOrderLogs);
                aOrderLogsArr.push(timestamp + "_" + key + "_New");
                aOrderLogs = this._array2json(aOrderLogsArr);
                LocalContractStorage.set("OrderLogs", aOrderLogs);

                let aOrders = LocalContractStorage.get("Orders");
                let aOrdersArr = this._json2array(aOrders);
                aOrdersArr.push(key);
                aOrders = this._array2json(aOrdersArr);
                LocalContractStorage.set("Orders", aOrders);

                let result = Blockchain.transfer(this.SuperAdmin, value);
                Event.Trigger("transfer", {
                    Status: true,
                    Transfer: {
                        from: Blockchain.transaction.to,
                        to: this.SuperAdmin,
                        value: value
                    }
                });
            } else {
                this.NewOrderLock = false;
                throw new Error("商品不存在");
            }
        } else {
            throw new Error("订单锁存在，请稍等一会儿再下单");
        }

    },

    /**
     * close order
     * @param orderid
     * @param closetext
     * @constructor
     */
    CloseOrder: function (orderid, closetext) {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            let aOrderItem = this.OrdersMap.get(orderid);
            if (aOrderItem) {
                aOrderItem.status = "Closed";
                aOrderItem.closetext = closetext;
                this.OrdersMap.set(orderid, aOrderItem);

                let timestamp = Date.now();
                let aOrderLogs = LocalContractStorage.get("OrderLogs");
                let aOrderLogsArr = this._json2array(aOrderLogs);
                aOrderLogsArr.push(timestamp + "_" + orderid + "_Closed");
                aOrderLogs = this._array2json(aOrderLogsArr);
                LocalContractStorage.set("OrderLogs", aOrderLogs);

            } else {
                throw new Error("订单不存在");
            }

        } else {
            throw new Error("限制访问");
        }
    },

    /**
     * returen Order list
     * @returns {string}
     * @constructor
     */
    OrderList: function () {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            let aOrders = LocalContractStorage.get("Orders");
            let result = [];
            for (let i in aOrders) {
                result.push(this.OrdersMap.get(aOrders[i]));
            }
            return JSON.stringify(result);
        } else {
            let aOrders = LocalContractStorage.get("Orders");
            let aOrdersArr = this._json2array(aOrders);
            let result = [];
            for (let i in aOrdersArr) {
                let key = aOrdersArr[i];
                let keyArr = key.split("_");
                if (keyArr[0]==from){
                    result.push(this.OrdersMap.get(key));
                }
            }
            return JSON.stringify(result);
        }
    },

    /**
     * return order detail
     * @param orderid
     * @returns {*}
     * @constructor
     */
    OrderInfo:function(orderid){
        let aOrderItem = this.OrdersMap.get(orderid);
        if (aOrderItem) {
            return aOrderItem;
        }else{
            throw new Error("订单不存在");
        }
    },

    /**
     * return Order change list
     * @returns {*}
     * @constructor
     */
    OrderLogsList:function () {
        let from = Blockchain.transaction.from;
        if (from == this.SuperAdmin) {
            let aOrderLogs = LocalContractStorage.get("OrderLogs");
            return aOrderLogs;
        }else{
            let aOrderLogs = LocalContractStorage.get("OrderLogs");
            let aOrderLogArr =this._json2array(aOrderLogs);
            let result = [];
            for (let i in aOrderLogArr) {
                let key = aOrderLogArr[i];
                let keyArr = key.split("_");
                if (keyArr[1]==from){
                    result.push(key);
                }
            }
            return this._array2json(result);
        }
    }



}
;

module.exports = CnnoContract;