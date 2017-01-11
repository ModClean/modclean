# ModClean Benchmarks
This is an additional list of benchmarks to show other common modules/frameworks. All benchmark results are from [modclean-benchmark](https://github.com/ModClean/modclean-benchmark). Feel free to create your own benchmarks and submit them in this file through a pull request.

### `npm install express lodash moment async`
Example of standard modules used to create basic web applications.

    modclean-benchmark -m express,lodash,moment,async -n default:safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 1,745       | 76            | 4.90 MB       |
| After ModClean  | 612         | 78            | 4.45 MB       |
| Reduced         | **144**     | **2**         | **459.59 KB** |


### `npm install grunt grunt-contrib-clean grunt-contrib-concat grunt-contrib-copy grunt-contrib-uglify`
Example of a standard grunt installation.

    modclean-benchmark -m grunt,grunt-contrib-clean,grunt-contrib-concat,grunt-contrib-copy,grunt-contrib-uglify -n default:safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 3,305       | 320           | 8.59 MB       |
| After ModClean  | 2,782       | 231           | 7.14 MB       |
| Reduced         | **523**     | **89**        | **1.44 MB**   |


### `npm install lodash commander colors async express q underscore debug coffee-script request chalk mkdirp`
Example of the most depended-upon modules from [npmjs.com](https://www.npmjs.com/) (4/28/2015).

    modclean-benchmark -m lodash,commander,colors,async,express,q,underscore,debug,coffee-script,request,chalk,mkdirp -n default:safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 2,148       | 222           | 6.20 MB       |
| After ModClean  | 1,620       | 191           | 4.59 MB       |
| Reduced         | **528**     | **31**        | **1.61 MB**   |


---

## Large Application Examples

### Application Framework Example
At the company I used to work for, our homegrown application framework uses a module set similar to the below:

    modclean-benchmark -m async,body-parser,colors,compression,cookie-parser,edge,express,express-debug,express-session,fs-extra,glob,humanize,jade,js-yaml,less,mime,moment,mongoose,ms,multer,node-uuid,numeral,on-finished,serve-favicon,lodash -n default:safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 5,848       | 946           | 32.81 MB      |
| After ModClean  | 3,455       | 628           | 26.19 MB      |
| Reduced         | **2,393**   | **318**       | **6.62 MB**   |
