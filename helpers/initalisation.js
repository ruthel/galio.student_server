const Admin = require('../models/user')
const Profile = require('../models/common/Profile')
const Admins = require('../providers/Admins')
const Profiles = require('../providers/Profiles')

exports.initDB = async () => {
  let allP = [1, 2, 21, 22, 23, 24, 25, 26, 261, 262, 27, 28, 29, 291, 3, 31, 32, 33, 34, 35, 36, 37, 38, 4, 41, 411, 412, 413, 42, 43, 44, 45, 46, 5, 51, 511, 52, 53, 54, 6, 61, 62, 63, 64, 7, 71, 72, 8]
  let noneP = [1]
  
  let ifSAdm = await Profile.count({where: {PROFILEID: 'SADM'}})
  if (ifSAdm === 0) {
    console.log('\nSuper admin profile not initiate...')
    console.log('beginning with initialization of data tables...')
    await Profiles.addProfile({
      privilege: allP,
      role: 'Super-Admin',
      id: 'SADM',
    })
  }
  
  let ifDefl = await Profile.count({where: {PROFILEID: 'DEFL'}})
  if (ifDefl === 0) {
    console.log('\nDefault profile not initiate...')
    console.log('beginning with initialization of data tables...')
    await Profiles.addProfile({
      privilege: noneP,
      role: 'default',
      id: 'DEFL',
    })
  }
  
  let ifAdmUser = await Admin.count({where: {REQUEST_GROUP_ID: 'ADM'}})
  if (ifAdmUser === 0) {
    console.log('\nSuperadmin user not initiate...')
    console.log('beginning with initialization of data tables...')
    await Admins.create({
      username: 'superadmin',
      pwd: 'admin123',
      profile: 'Super-Admin',
      group: 'ADM',
      privilege: allP
    })
  }
}