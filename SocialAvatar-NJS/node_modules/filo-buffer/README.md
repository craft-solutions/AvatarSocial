## What's filo-buffer?

filo-buffer is a nodejs module that provides a fixed size text buffer implementation.

## Installation

The recommended way is through the excellent [NPM](http://www.npmjs.org/):

    $ npm install filo-buffer

## Usage

- Create a small buffer with a fixed size of 5 characters :

```javascript
      var b = new FiloBuffer(5); // instanciate the FiloBuffer class
```
- Put some data in it :

```javascript
      b.put('abc');
      b.toString(); // returns the buffer content => 'abc'
```
- Same with more data :

```javascript
      var b = new FiloBuffer(5);
      b.put('abcdefg');
      b.toString(); // => 'cdefg'
```

As an example, I use it as an alternative of log files in projects.
A circular memory buffer limited to 4Kb is enough and no need to rotate, purge generated logs.

Enjoy !
