import SparkMD5 from 'spark-md5';

const calcBrowserMD5 = (s) => {
	return SparkMD5.hash(s);
};

export default calcBrowserMD5;
