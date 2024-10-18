const jwt = require('jsonwebtoken')
const Student = require("../models/evaluation/Student");

exports.onBeforeCall = async (ctx, route, req, res) => {
  try {

    if (req.headers['authorization']) {

      const token = req.headers['authorization'].replace('Bearer ', '')
      let decodedU;
      try {

        decodedU = jwt.verify(token, process.env.admKey);
        if (decodedU) {

          let User = await ctx.call('users.model')
          const user = await User.findOne({
            where: {
              id: decodedU.id,
              'TOKEN': token
            }
          })

          if (user) {

            req.token = token
            req.user = user

          } else
            throw new Error('Invalid user token identifier')

        }

      } catch (e) {

        try {

          const decodedE = jwt.verify(token, process.env.empKey)
          if (decodedE) {

            let Employee = await ctx.call('employees.model')
            const employee = await Employee.findOne({
              where: {
                id: decodedE.id,
                'TOKEN': token
              }
            })

            if (employee) {

              req.token = token
              req.user = employee

            } else
              throw new Error('Invalid employee token identifier')

          }

        } catch (e) {

					try {

						const decodedR = jwt.verify(token, process.env.revKey)
						if (decodedR) {

							let Student = await ctx.call('students.model')
							const student = await Student.findOne({
								where: {
									id: decodedR.id,
									'TOKEN': token
								}
							})

							if (student) {

								req.token = token
								req.user = student

							} else
								throw new Error('Invalid employee token identifier')
						}

					} catch (e) {
						if (!(!ctx.params.apiGKey || ctx.params.apiGKey !== process.env.apiGKey)) {

							req.token = {}
							req.user = {}

						} else {
							throw new Error('Invalid token')
						}
					}
        }
      }
    } else {
      if (!(!ctx.params.req.query?.apiGKey || ctx.params.req.query?.apiGKey !== process.env.apiGKey)) {
        req.token = {}
        req.user = {}
      } else {
        throw new Error('Invalid token')
      }
    }
  } catch
    (e) {
    console.log(e)
    res.writeHead(401);
    return res.end(JSON.stringify({error: 'Please authenticate'}));
  }
}
