# ModClean Benchmarks
This is an additional list of benchmarks to show other common modules/frameworks. All benchmark results are from [modclean-benchmark](https://github.com/KyleRoss/modclean-benchmark). Feel free to create your own benchmarks and submit them in this file through a pull request.

### `npm install express lodash moment async`
Example of standard modules used to create basic web applications.

    modclean-benchmark -m express,lodash,moment,async -n safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 753         | 81            | 5.13 MB       |
| After ModClean  | 612         | 78            | 4.76 MB       |
| Reduced         | **141**     | **3**         | **382.85 KB** |


### `npm install grunt grunt-contrib-clean grunt-contrib-concat grunt-contrib-copy grunt-contrib-uglify`
Example of a standard grunt installation.

    modclean-benchmark -m grunt,grunt-contrib-clean,grunt-contrib-concat,grunt-contrib-copy,grunt-contrib-uglify -n safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 1,402       | 291           | 8.99 MB       |
| After ModClean  | 859         | 226           | 6.28 MB       |
| Reduced         | **543**     | **65**        | **2.71 MB**   |


### `npm install lodash commander colors async express q underscore debug coffee-script request chalk mkdirp`
Example of the most depended-upon modules from [npmjs.com](https://www.npmjs.com/) (4/28/2015).

    modclean-benchmark -m lodash,commander,colors,async,express,q,underscore,debug,coffee-script,request,chalk,mkdirp -n safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 1,285       | 222           | 5.09 MB       |
| After ModClean  | 819         | 190           | 3.62 MB       |
| Reduced         | **466**     | **32**        | **1.48 MB**   |


---

## Large Application Examples

### Application Framework Example
At the company I work for, our homegrown application framework uses a module set similar to the below:

    modclean-benchmark -m async,body-parser,colors,compression,cookie-parser,edge,express,express-debug,express-session,fs-extra,glob,humanize,jade,js-yaml,less,mime,moment,mongoose,ms,multer,node-uuid,numeral,on-finished,serve-favicon,lodash -n safe

|                 | Total Files | Total Folders | Total Size    |
| --------------- | ----------- | ------------- | ------------- |
| Before ModClean | 5,905       | 1,265         | 84.53 MB      |
| After ModClean  | 2,730       | 824           | 36.76 MB      |
| Reduced         | **3,175**   | **441**       | **47.76 MB**  |
