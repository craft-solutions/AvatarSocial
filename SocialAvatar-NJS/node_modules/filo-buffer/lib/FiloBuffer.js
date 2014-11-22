function DataItem(value) {
  this._value = value || null;
  this._next = null;
}

function FiloBuffer(maxSize) {
  this._bufferMaxSize = maxSize;
  this._bufferSize = 0;
  this._rootData = null;
  this._currentData = null;
  this._listener = null;
}

FiloBuffer.prototype.clear = function () {
  var data, nextData;
  if (!this._bufferSize) {
    return false;
  }
  data = this._rootData;
  while (true) {
    delete data._value;
    nextData = data._next;
    if (!nextData) {
      break;
    }
    delete data._next;
    delete data;
    data = nextData;
  }
  this._bufferSize = 0;
  this._currentData = this._rootData;
};

FiloBuffer.prototype.clearListener = function () {
  this._listener = null;
};

FiloBuffer.prototype.getMaxSize = function () {
  return this._bufferMaxSize;
};

FiloBuffer.prototype.getSize = function () {
  return this._bufferSize;
};

FiloBuffer.prototype.put = function (data) {
  var i;
  for (i = 0; i < data.length; i++) {
    if (!this._bufferSize) {
      this._rootData = this._currentData = new DataItem(data[i]);
    } else {
      this._currentData._next = new DataItem(data[i]);
      this._currentData = this._currentData._next;
    }
    this._bufferSize++;
    if (this._bufferSize > this._bufferMaxSize) {
      this._rootData = this._rootData._next;
      this._bufferSize--;
    }
  }
  if (this._listener) {
    this._listener(data);
  }
};

FiloBuffer.prototype.registerListener = function (listener) {
  this._listener = listener;
};

FiloBuffer.prototype.toString = function () {
  var result, data, i;
  result = '';
  for (i = 0; i < this._bufferSize; i++) {
    data = data ? data._next : this._rootData;
    result += data._value;
  }
  return result;
};

module.exports = FiloBuffer;