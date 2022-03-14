const belib = require('./be/belib');
const c = require('../backCore.js');
const fs = require('fs');

function Upload(req, res) {
	//OBSOLETE, used socketio-file-upload
	const multiparty = require('multiparty');
	const free_size = belib.GetFreeSizeOnStorage(c.DOWNLOAD_PATH);
	console.log('Upload free_size', free_size);
	req.setTimeout(4 * 60 * 1000);
	// создаем форму
	const form = new multiparty.Form();
	//здесь будет храниться путь с загружаемому файлу, его тип и размер
	const uploadFile = { uploadPath: '', type: '', size: 0 };
	//максимальный размер файла
	//поддерживаемые типы(в данном случае это картинки формата jpeg,jpg и png)
	// var supportMimeTypes = ['image/jpg', 'image/jpeg', 'image/png'];
	//массив с ошибками произошедшими в ходе загрузки файла
	const errors = [];

	//если произошла ошибка

	form.on('error', function () {
		if (fs.existsSync(uploadFile.path)) {
			//если загружаемый файл существует удаляем его
			fs.unlinkSync(uploadFile.path);
			//  console.log('multiparty.error');
		}
		// res.send({status: 'ok', text: 'Success'});
	});

	form.on('close', function () {
		//  console.log('multiparty.close');
		//если нет ошибок и все хорошо
		if (errors.length === 0) {
			//console.log('multiparty.Success');
			//сообщаем что все хорошо
			res.send({ status: 'ok', text: 'Success' });
			res.end();
		} else {
			if (fs.existsSync(uploadFile.path)) {
				//если загружаемый файл существует удаляем его
				//console.log('multiparty. fs.unlinkSync(uploadFile.path);');
				fs.unlinkSync(uploadFile.path);
			}
			//сообщаем что все плохо и какие произошли ошибки
			// console.log('multiparty.bad');
			res.send({ status: 'bad', errors: errors });
		}
	});

	// при поступление файла
	form.on('part', function (part) {
		//console.log('incoming part',part);
		//   if (part.filename==undefined) {
		//      form.parse(req);
		//     return;
		//}
		//читаем его размер в байтах
		uploadFile.size = part.byteCount;
		//читаем его тип
		uploadFile.type = part.headers['content-type'];
		//путь для сохранения файла
		uploadFile.path = c.DOWNLOAD_PATH + '/' + part.filename;
		console.log('Upload file', uploadFile.path);
		//проверяем размер файла, он не должен быть больше максимального размера
		if (uploadFile.size > free_size) {
			errors.push(
				'File size is ' + uploadFile.size + '. Limit is ' + free_size / 1024 / 1024 + 'MB.'
			);
			// console.log('multiparty. File size is ' + uploadFile.size + '. Limit is' + (maxSize / 1024 / 1024) + 'MB.');
			console.log(
				'File size is ' + uploadFile.size + '. Limit is ' + free_size / 1024 / 1024 + 'MB.'
			);
		}

		//проверяем является ли тип поддерживаемым
		//   if(supportMimeTypes.indexOf(uploadFile.type) == -1) {
		//      errors.push('Unsupported mimetype ' + uploadFile.type);
		// }

		//если нет ошибок то создаем поток для записи файла
		if (errors.length === 0) {
			//console.log('multiparty.  var out = fs.createWriteStream(uploadFile.path);');
			let out;
			if (part.filename !== undefined) {
				out = fs.createWriteStream(uploadFile.path);
			} else out = fs.createWriteStream('/dev/zero');

			part.pipe(out);
		} else {
			//пропускаем
			//вообще здесь нужно как-то остановить загрузку и перейти к onclose
			//console.log('multiparty.  part.resume();');
			part.resume();
			//res.header('Connection', 'close');
			res.status(413); //.body('Upload too large');
		}

		part.on('aborted', function () {
			if (fs.existsSync(uploadFile.path)) {
				//если загружаемый файл существует удаляем его
				fs.unlinkSync(uploadFile.path);
				//  console.log('multiparty.error');
			}
			console.log('aborted, file ', uploadFile.path, 'removed');
			// res.send({status: 'ok', text: 'Success'});
		});

		part.on('error', function () {
			if (fs.existsSync(uploadFile.path)) {
				//если загружаемый файл существует удаляем его
				fs.unlinkSync(uploadFile.path);
				//  console.log('multiparty.error');
			}
			console.log('error upload, file ', uploadFile.path, 'removed');
			// res.send({status: 'ok', text: 'Success'});
		});
	});

	// console.log('multiparty.  form.parse(req);');
	// парсим форму
	form.parse(req);
}

module.exports = {
	Upload
};
