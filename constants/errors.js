const errorCodes = require("./errorCodes");
const erros = (error, ctx) => {
  switch (error) {
    case errorCodes.notUniq:
      ctx.meta.$statusCode = 409;
      return {messageSb: 'Error occurred because a session with same reference already exists'}
  }
}
module.exports = erros