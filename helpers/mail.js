const nodemailer = require("nodemailer");

	const Transporter = ({user, pass}) => {
		return nodemailer.createTransport({
			host: 'smtp.office365.com',
			port: 587,
			auth: {user, pass},
			tls: {ciphers: 'SSLv3'}
		});
	}

	let galio = {
		user: "galio.noreply@myiuc.com",
		pass: "U5/_2304@@g@l!0-2023="
	}

	const tRoot = Transporter(galio)

exports.welcomeEmail = async ({email, emailText, emailsSubject, token, matricule}) => {
		let options = {
			from: galio.user,
			to: email,
			subject: emailsSubject,
			html: `
				 <div>
						<div style="max-width: 600px; margin: 0 auto; line-height: 1.5;">
								<h1>BIENVENUE SUR GALIO</h1>
								<div style="margin-top: 12px">
										Ce message vous est envoyé pour la validation de votre creation de compte sur la plate-forme de services des
										etudiants de l'Institut Universitaire de la Côte <strong>(IUC)</strong>. Pour confirmer votre adresse
										mail et terminer cette procédure d'enrolement, veuillez cliquer sur le lien ci-après, ou le copier dans
										votre navigateur internet
								</div>
								<div style="margin-top: 12px">
										This message is sent to you because you just registered on the GALIO portal, the human resources portal of inscription
										the Institut Universitaire de la Côte <strong>(IUC)</strong>. To confirm your email address and validate your registration process,
										please click on the link below (or copy it in your web browser)
								</div>
								<div style="margin-top: 12px">
										 <a style="
												display: block;
												background: #6c63ff;
												text-decoration: none;
												color: white;
												padding: 8px 0;
												text-align: center;
												margin: 12px 0 0;
												border-radius: 4px;"
											 href='${process.env.root}email-confirmation?token=${token}'>Cliquez ici pour vous connecter / Click here to connect </a>
											 <br>
											 Ou Copiez le lien ci-après dans votre navigateur/Or copy this link in your web browser:
											 <br>
												${process.env.root}email-confirmation?token=${token}
								</div>

								<p>
										Vous paramètres de connexion à votre compte sont les suivants / Your connection credentials are the following: <br><br>
										<span style="margin-left: 16px">
												Nom d'utilisateur/Username: <strong>${email}</strong><br>
										</span>
										<span style="margin-left: 16px">
												Mot de passe/Password: <strong>${matricule}</strong>
										</span>
								</p>

								<p>
										<strong>
												Ces liens ne seront plus valides si vous n'achevez pas cette étape dans les prochaines 24 heures !
										</strong>
										<div style="font-size: 12px; color: rgba(0,0,0,8); margin-top: 13px; text-align: center; font-style: italic">Ces
												identifiants sont personnels et privés. A ce titre, nous
												ne sommes responsables d'aucunes pertes de données ou ursupations d'identités dans le système. De même, tous comportements déviant
										s   ur la plate-forme allant à l'encontre de la règlementation en vigeure prévue dans le cadre du respect de la loi pourraient être sujetes à des poursuites judiciaires
										</div>
								</p>

								<p>
										<strong>
												Theses links will not be valid anymore if you don't confirm via this email in the next 24 hours !
										</strong>
										<div style="font-size: 12px; color: rgba(0,0,0,8); margin-top: 13px; text-align: center; font-style: italic">Thess
												credentials are personnal and private. We are not responsible
												for any user date loss or usurpation in the system. Any suspicious or illegal behaviour on the platform, may be lead to legal proceedings
										</div>
								</p>
						</div>
				</div>
							`,
		};
		return sendMail(options)
	};
exports.orderTransactionMail = async (candidate) => {
	let options = {
		from: galio.user,
		to: candidate.EMAIL,
		subject: "PAIEMENT DE FRAIS D'ADMISSION POUR CONCOURS IUC",
		html: `
					<div>
						<h1>Reçu de paiement</h1>
						<p>Nom de l'entreprise : <strong>Institut Universitaire de la Côte (IUC)</strong></p>
						<p>Date : ${new Date(candidate.transactionDate).toDateString()}</p>
						<p>Matricule : ${candidate.MATRICULE?.toUpperCase()}</p>
						<p>Description : Concours académique</p>
						<p>Montant payé : ${candidate.transactionAmount} FCFA</p>
						<p>Compte : ${candidate.accountNumber}</p>
						<p>Transaction ID : ${candidate.orderNumber}</p>
						<!-- Ajoutez d'autres détails ici -->
					</div>
							`,
	};
	return sendMail(options)
};
	exports.birthdayEmail = async ({EMAIL, FIRSTNAME, LASTNAME, BIRTHDATE, MATRICULE}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: 'HAPPY BIRTHDAY',
			html: `
				 <div>
						<div style="max-width: 600px; margin: 0 auto; line-height: 1.5; font-size: 18px">
							<h1>${LASTNAME} ${FIRSTNAME}</h1>
							<div style="margin-top: 12px">
								Nous sommes le ${new Date().toLocaleDateString('fr', {day: '2-digit', month: 'long', year: 'numeric'})}.<br>
								Aujourd’hui n’est pas un jour comme les autres. <strong>C’est votre anniversaire !</strong><br>
								Les équipes et STAFF de l'<strong>Insitut Universitaire de la Côte</strong> se joignent à moi pour vous souhaiter une très belle journée.<br>
								À très vite dans votre magasin et sur (Site Web).
							</div>
							<div>Signature</div>
							<br>
							<hr>
							<br>
							<div>
								It is ${new Date().toLocaleDateString('en', {day: '2-digit', month: 'long', year: 'numeric'})}.<br>
								Today is not a day like the others. <strong>It's your birthday!</strong><br>
								The teams and STAFF of the <strong>Institut Universitaire de la Côte</strong> join me in wishing you a very nice day.<br>
								See you soon in your store and on (Website).
							</div>
							<div>Signature</div>
						</div>
				</div>
							`,
		};
		return sendMail(options)
	};
	exports.forwardToEmail = async ({EMAIL, FULLNAME, MATRICULE}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: "USER GUIDE / GUIDE D'UTILISATION",
			html: `
				 <div>
						<div style="max-width: 768px; margin:auto;">
								<p>
										<h2>Bienvenue sur GALIO, ${FULLNAME}</h2>
										Pour vous connecter vous devez au préalable valider la création de votre compte en cliquant sur
										<a href="https://galio.myiuc.com/register">S'INSCRIRE</a> et entrer votre matricule présenté ci-dessous : <br>
										<strong>Matricule : ${MATRICULE}</strong> <br> Un guide d’utilisateur en français est disponible <a href="https://www.iuc-univ.com/2021/06/16/5380/">ICI</a> et
										vous pourrez le télécharger  en cliquant sur le lien <a href='https://www.iuc-univ.com/wp-content/uploads/2021/06/TUTO-GALIO-Permanents-V1.2-1.pdf'>suivant</a> <br> Contact: <a href="mailto://numerique.educatif@myiuc.com">Numeric educatif</a>
								</p>
								<p>
										<h2>Welcome to GALIO, ${FULLNAME}</h2>
										To connect you must first validate the creation of your account by clicking on
										<a href="https://galio.myiuc.com/register">REGISTER</a> and enter your number shown below: <br>
										<strong>Matricule : ${MATRICULE}</strong> <br> A user guide in French is available <a href="https://www.iuc-univ.com/2021/06/16/5380/">HERE</a> and you can download it by clicking <a href='https://www.iuc-univ.com/wp-content/uploads/2021/06/TUTO-GALIO-Permanents-V1.2-1.pdf'>here</a>
										Contact: <a href="mailto://numerique.educatif@myiuc.com">Numeric educatif</a>
								</p>
						</div>
				 </div>
							`,
		};
		return sendMail(options)
	};
	exports.contactUs = async ({EMAIL, FULLNAME, MATRICULE, MESSAGE, NUMPHONE, OBJECT}) => {
		let options = {
			from: galio.user,
			to: 'numerique.educatif@myiuc.com',
			subject: "ACCOUNT PROBLEM ALERT / ALERTE DE PROBLEME DE COMPTE",
			html: `
				 <div>
						<div style="max-width: 768px; margin:auto;">
								<p>
									<h2>OBJECT: ${OBJECT}</h2>
									<h3>NAME: ${FULLNAME}</h3>
									<h3>EMAIL: ${EMAIL}</h3>
									<h3>MATRICULE: ${MATRICULE}</h3>
									<h3>PHONE: ${NUMPHONE}</h3>
									<div>
											${MESSAGE},
									</div>
								</p>
						</div>
				 </div>
							`,
		};
		return sendMail(options)
	};
	exports.closedRequest = async ({REQUEST_ID}, {EMAIL, FIRSTNAME, LASTNAME}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: "REQUEST DECISION ALERT / ALERTE DE DECISION SUR VOTRE REQUETE",
			html: `
				 <div>
						<div style="max-width: 768px; margin:auto;">
							<div>Bonjour M/Mme ${LASTNAME} ${FIRSTNAME}</div>
							<div>Votre requête numéro ${REQUEST_ID} a fait l'objet d'une décision.</div>
							<div>Veuillez-vous connecter à votre compte sur <a href="https://galio.myiuc.com">Galio</a>, au menu Récentes Activités, dans l'onglet Vos Requêtes.</div>
							<br>
							<div>En cas de question, écrivez-nous à l'adresse <a href="mailto:numerique.educatif@myiuc.com ">numerique.educatif@myiuc.com </a></div>
							<br>
							Cordialement
						</div>
						<br>
						<hr>
						<br>
						<div style="max-width: 768px; margin:auto;">
							<div>Hello Mr./Ms. ${LASTNAME} ${FIRSTNAME}</div>
							<div>Your request number ${REQUEST_ID} has been decided.</div>
							<div>Please log in to your account on <a href="https://galio.myiuc.com">Galio</a>, to the Recent Activities menu, in the Your Requests tab, to see the response to the request and any corresponding details.</div>
							<br>
							<div>If you have any questions, please write to us at <a href="mailto:numerique.educatif@myiuc.com ">numerique.educatif@myiuc.com </a></div>
							<br>
							Sincerely
						</div>
				 </div>
							`,
		};
		return sendMail(options)
	};
	exports.contactHim = async ({DESIGNATION, EMPLOYEE}) => {
		let options = {
			from: galio.user,
			to: EMPLOYEE.EMAIL,
			subject: "MESSAGE INFORMATION",
			html: `
				 <div>
						<div style="max-width: 768px; margin:auto;">
								<p>
									<h3>M/Mme : ${EMPLOYEE.LASTNAME} ${EMPLOYEE.FIRSTNAME}</h3>
									<div>
											${DESIGNATION},
									</div>
								</p>
						</div>
				 </div>
							`,
		};
		return sendMail(options)
	};
	exports.codeEmail = async ({EMAIL, FIRSTNAME, LASTNAME, MATRICULE}, code) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: "CONFIRM ACCESS CODE||CONFIRMATION DU CODE D'ACCES",
			html: `
				 <div>
				 <div style="max-width: 768px; margin:auto; text-align: justify">
			<h2 style="text-align: center">DEMANDE DE VERIFICATION</h2>
			<h3>Ce message est envoyé automatiquement par la plateforme GALIO et fait partie de la procédure de connexion sécurisée au portail.</h3>
				Nous avons détecté une demande de connexion à votre compte
			<ul>
				<li>Propriétaire du compte: ${LASTNAME} ${FIRSTNAME}</li>
				<li>Matricule: ${MATRICULE}</li>
				<li>Email: ${EMAIL}</li>
				<li>Date: ${new Date().toISOString()}</li>
			</ul>
			Afin de vérifier que c’est bien vous qui êtes à l’origine de la tentative de connexion, veuillez taper le code suivant dans GALIO pour autoriser votre connexion — expiration dans 15 minutes:
			<div
				style="text-align: center; background: lightgrey; padding: 4px;margin: 12px 0; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 2px">
				${code}
			</div>
			Si vous n’êtes pas à l’origine de cette tentative de connexion, veuillez ne rien renseigner et signaler cet incident par mail à l’adresse : <a href="mailto:numerique.educatif@myiuc.com "> numerique.educatif@myiuc.com</a><br>
		</div>
		<br>
		<hr>
		<br>
					 <div style="max-width: 768px; margin:auto; text-align: justify">
			<h2 style="text-align: center">VERIFICATION NEEDED</h2>
			<h3>This message is sent automaticaly by the GALIO platform, and is part of the secured connection procedure.</h3>
			We have detected a sign-in request to your account.
			<ul>
				<li>Owner of the account: ${LASTNAME} ${FIRSTNAME}</li>
				<li>Matricule: ${MATRICULE}</li>
				<li>Email: ${EMAIL}</li>
				<li>Attempted at: ${new Date().toISOString()}</li>
			</ul>
			In order to verify that you are the requester, please type the following code in GALIO to authorize your connection. — it will expire in 15 minutes:
			<div
				style="text-align: center; background: lightgrey; padding: 4px;margin: 12px 0; border-radius: 4px; font-size: 24px; font-weight: bold; letter-spacing: 2px">
				${code}
			</div>

		 If you are not the person who tried to connect, please dont type anything and report this incident by mail to this adress :
		 <a href="mailto:numerique.educatif@myiuc.com">numerique.educatif@myiuc.com</a><br>
		</div>

				 </div>
							`,
		};
		return sendMail(options)
	}
	exports.closeConfirmationEmail = async ({EMAIL, FIRSTNAME, LASTNAME}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: 'Mail de confirmation pour la phase une',
			html:
				`
				<div style="line-height: 1.5; max-width: 768px; width: 100%; margin: auto; text-align: justify">
		<h2 style="text-align: center; text-transform: uppercase">Confirmation de validation de la première phase du processus
			d’enregistrement</h2>
		<p>
			M. / Mme ${LASTNAME} ${FIRSTNAME} <br>
			<strong>Félicitation</strong>, vous avez terminé la première phase du processus d’enregistrement et nous vous
			remercions d’avoir mis à jour vos informations, votre implication dans ce processus permettra d’améliorer la qualité des services
			aux enseignants. Pour la suite de la procédure vous devez vous présenter <strong>au bureau des enseignants à la
			porte
			AB009</strong> afin de :
		</p>
		<strong>
			<ol>
				<li>Faire valider votre identité d’une part et activer votre compte d’autre part</li>
				<li>Enregistrer vos empreintes biométriques pour le système de pointage.</li>
				<li>Capturer votre démi-carte photo</li>
			</ol>
		<p>
			<strong>NB:</strong> Si vous aviez au préalable déjà complété complètement votre enregistrement, et que vous êtes
			 dans une procédure de correction ou mise à jour de vos informations, veuillez vous adresser aux services des
			 ressources humaines pour la réactivation complète de votre compte !!
		</p>
		</strong>
		Une fois la procédure de validation de votre compte terminée, vous pourrez accdéder aux autres fonctionnalités du
		portail, telles que les choix de cours, l'emploi du temps et plus encore. Un mail vous sera transmis pour vous
		informer l’état du traitement de votre dossier. <br>
		<strong>Cordialement !</strong>
		<br>
		<br>
		<hr>
		<h2 style="text-align: center; text-transform: uppercase">Confirmation of validation of the first step of the
			registration process</h2>
		<p>
			<strong>Congratulations</strong>, you have completed the first step of the registration process
			and we thank you for updating your information. Your involvement in this process will help improve the quality
			of services to teachers. For the next you must go <strong>to the teachers' office at door AB009</strong> in order to
			:
		</p>
		<strong>
			<ol>
				<li>Validate your identity and activate your account</li>
				<li>Register your biometric fingerprints for the time and attendance system.</li>
				<li>Capture your photo card</li>
			</ol>
		<p>
			<strong>NB:</strong> If you had already previously fully completed your registration process, and you are just
			correcting or updating your information, please contact the human resources service for the full reactivation
			of your account !!
		</p>
		</strong>
		Once the validation process of your account is completed, you will be able to make your course choices and submit
		them before the deadline prescribed by the administration. An email will be sent to you to inform you of the status
		of your file. <br>
		<strong>Sincerely !</strong>
	</div>
				`,
		};
		return sendMail(options)
	};
	exports.activationToCourse = async ({EMAIL, FIRSTNAME, LASTNAME}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: 'ACTIVATION OF COURSE CHOICE||ACTIVATION DE CHOIX DE COURS',
			html:
				`
				<div style="line-height: 1.5; max-width: 768px; width: 100%; margin: auto; text-align: justify">
			<h2 style="text-align: center; text-transform: uppercase">CONFIRMATION D’ACTIVATION FINALE DE COMPTE</h2>
			<p>
				M. / Mme ${LASTNAME} ${FIRSTNAME} <br>
				<strong>Félicitation</strong>, vous avez terminé et validé toutes les phases d’enregistrement et d’identification
				sur la plateforme GALIO. Nous avons le plaisir de vous annoncer que votre compte est maintenant activé, et vous
				pouvez accéder aux autres fonctionnalités du portail déjà disponibles, telles que l'emploi du temps,ou les
				sessions de choix de cours que vous voudriez disposant pour l’année scolaire à venir (<strong>accessible via le
				second icône en forme de chapeau de diplômé, dans la barre de menus verticale rouge à gauche de votre écran</strong>),
				lorsqu'une session est ouverte.
			</p>
			Voici un petit rappel des boutons principaux sur l'interface de choix des cours:
			<ul>
				<li><strong>VIDER</strong> : vide votre liste de choix pour recommencer à zéro, et la sauvegarde vide</li>
				<li><strong>SAUVEGARDER</strong> : sauvegarde vos choix jusqu’à présent, pour pouvoir continuer maintenant ou
					plus tard lors d’une autre connexion. Mets à jour le récapitulatif dans l’onglet Activités Récentes
				</li>
				<li><strong>CLOTURER</strong> : sauvegarder et clôturer définitivement votre session de cours ! Vous ne pourrez
					plus choisir ou modifier vos choix après cela !
				</li>
			</ul>
			D’autres fonctionnalités seront disponibles au fur et à mesure pour diversifier les services qui vous seront
			proposés sur votre plateforme de self-service GALIO. <br>
			<strong>Cordialement !</strong>
			<br>
			<br>
			<hr>
			<h2 style="text-align: center; text-transform: uppercase">CONFIRMATION OF FINAL ACCOUNT ACTIVATION</h2>
			<p>
				M. / Mme ${LASTNAME} ${FIRSTNAME} <br>
				<strong>Congratulations</strong>, you have successfully achieved all the steps required for your complete
				registration procedure on GALIO. We are pleased to announce you that your account has been fully activated, and
				you can now access the other available features of the portal, such as your weekly schedule, or the courses
				choice session, where you will be able the select te courses you wish to teach for the main academic year
				(<strong>located on the second icon on the vertical red menu bar in the shape of a graduate hat, on the left side
				of the screen</strong>), assuming a choice session is opened.
			</p>
			These are the functions of some main buttons on that menu :
			<ul>
				<li><strong>CLEAR</strong> : empty your choice list, and save it as empty</li>
				<li><strong>SAVE</strong> : save your choices made until now, so you can continue on a further connection. This
					upadte your choices in your Recent Activities menu
				</li>
				<li><strong>SAVE & LOCK</strong> : save and closes permanently your current session ! No more choices or changes
					would be allowed after that !
				</li>
			</ul>
			Other features will soon and continually be released to enrich the services panel proposed to you on your
			self-service portal GALIO. <br>
			<strong>Sincerely !</strong>
		</div>

				`,
		};
		return sendMail(options)
	};
	exports.closeCoursesChoices = async (app, {DESIGNATION}, {EMAIL}) => {
		let options = {
			from: galio.user,
			to: EMAIL,
			subject: "CHOICES SESSION CLOSURE||CLÔTURE DE SESSION DE CHOIX",
			html:
				`
			<div style="line-height: 1.5; max-width: 768px; width: 100%; margin: auto; text-align: justify">
			<h2 style="text-align: center; text-transform: uppercase">CONFIRMATION DE CLOTURE DE VOTRE SESSION DE CHOIX DE
				COURS</h2>
			<p>Vous venez de clôturer votre session de choix de cours
				<strong>${DESIGNATION}</strong>. Vous ne pouvez plus modifier cette liste.
			</p>
			<p>Nous vous remercions de l’engagement que vous manifestez envers notre institut, et vos intentions seront prises
				en compte. Un comité siègera pour l’attribution des cours, et vous serez notifié des décisions qui vous
				concerneront à ce sujet, ainsi que de l’ouverture d’une autre session de choix.
			</p>
			<p>D’autres fonctionnalités sont disponibles pour diversifier les services qui vous sont proposés sur votre
			plateforme de self-service GALIO, telles que votre emploi dutemps, ou les requêtes. </p>
			<strong>Contact : </strong><a href="mailto:numerique.educatif@myiuc.com">numerique.educatif@myiuc.com</a>
			<br>
			<br>
			<hr>
			<h2 style="text-align: center; text-transform: uppercase">CONFIRMATION OF COURSES CHOICE SESSION CLOSURE</h2>
			<p>Vous venez de clôturer votre session de choix de cours
				You just close and lock your courses choices session
				${DESIGNATION}. You won’t be able anymore to modify this list.
			</p>
			<p>We’d like to thank you for the commitment you shiw to our institute, and your intentions will be taken in
				consideration. A comitee will stand for the courses affectation, and you will be notified of any decision taht
				concerns you on this subject, as well as the opening of another choice session.</p>
			<p>Other features are available to enrich the services panel proposed to you on your self-service portal GALIO,
			 such as your weekly schedule, or the request workflow. </p>
			<strong>Contact : </strong><a href="mailto:numerique.educatif@myiuc.com">numerique.educatif@myiuc.com</a>
		</div>
				`,
		};
		return sendMail(options)
	};
exports.emailAuth = async (EMAIL) => {
	let options = {
		from: galio.user,
		to: EMAIL,
		subject: "BIENVENUE SUR LA PLATEFORME D'ADMISSION DE IUC",
		html:
			`
		 <div class="container">
        <h1>Bienvenue sur la platforme d'admission de IUC !</h1>
        <p>Cher(e) utilisateur(trice),</p>
        <p>Nous sommes ravis de vous accueillir sur la plateforme GALIO ! 🎉</p>
        <p>Pour confirmer votre adresse e-mail et finaliser votre inscription, veuillez cliquer sur le bouton "Authentification" ci-dessous :</p>
        <a href="${process.env.root}session-type" class="button">Authentification</a>
        <p>Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter. Nous sommes là pour vous assister !</p>
        <p>Cordialement,<br>L'équipe GALIO</p>
    </div>
				`,
	};
	return sendMail(options)
};

	const sendMail = async (option, transporter = tRoot) => {
		const info = await transporter.sendMail(option);
		const {messageId} = info;
		if (!messageId)
			throw new Error("An error occured .Please contact developer team");
		return messageId;
	}


