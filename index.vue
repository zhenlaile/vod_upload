<template>
  <div class="upload-file">
    <el-upload
      :action="uploadFileUrl"
      :before-upload="handleBeforeUpload"
      :file-list="fileList"
      :limit="limit"
      :on-error="handleUploadError"
      :on-exceed="handleExceed"
      :on-success="handleUploadSuccess"
      :headers="headers"
      :http-request="uploading"
      class="upload-file-uploader"
      ref="upload"
      drag
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>

      <!-- 上传按钮 -->
      <!-- <el-button size="mini" type="primary">选取文件</el-button> -->
      <!-- 上传提示 -->
      <div class="el-upload__tip" slot="tip" v-if="showTip">
        请上传
        <template v-if="fileSize">
          大小不超过 <b style="color: #f56c6c">{{ fileSize }}MB</b>
        </template>
        <template v-if="fileType">
          格式为 <b style="color: #f56c6c">{{ fileType.join('/') }}</b>
        </template>
        的文件
      </div>
    </el-upload>

    <!-- 文件列表 -->
    <transition-group
      class="upload-file-list el-upload-list el-upload-list--text"
      name="el-fade-in-linear"
      tag="ul"
      v-show="false"
    >
      <li
        :key="file.uid"
        class="el-upload-list__item ele-upload-list__item-content"
        v-for="(file, index) in fileList"
      >
        <el-link
          :href="`${baseUrl}${file.url}`"
          :underline="false"
          target="_blank"
        >
          <span class="el-icon-document"> {{ getFileName(file.name) }} </span>
        </el-link>
        <div class="ele-upload-list__item-content-action">
          <el-link :underline="false" @click="handleDelete(index)" type="danger"
            >删除</el-link
          >
        </div>
      </li>
    </transition-group>
  </div>
</template>

<script>
import { getToken } from '@/utils/auth'
import { getVodAuth, confirmVod } from '@/api/vod'
export default {
  name: 'VodUpload',
  props: {
    // 值
    value: [String, Object, Array],
    // 数量限制
    limit: {
      type: Number,
      default: 5
    },
    // 大小限制(MB)
    fileSize: {
      type: Number,
      default: 5
    },
    // 文件类型, 例如['png', 'jpg', 'jpeg']
    fileType: {
      type: Array,
      default: () => ['mp4', 'xls', 'ppt', 'txt', 'pdf']
    },
    // 是否显示提示
    isShowTip: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      baseUrl: process.env.VUE_APP_BASE_API,
      uploadFileUrl: process.env.VUE_APP_BASE_API + '/common/upload', // 上传的图片服务器地址
      headers: {
        Authorization: 'Bearer ' + getToken()
      },
      fileList: [],
      vodClient: {},
      vodAuth: {},
      tempFileList: [],
      fileItem: []
    }
  },
  watch: {
    value: {
      handler(val) {
        if (val) {
          if (this.fileList.length == this.limit) {
            return
          }
          let temp = 1
          // 首先将值转为数组
          const list = Array.isArray(val) ? val : this.value.split(',')
          // 然后将数组转为对象数组
          this.fileList = list.map(item => {
            if (typeof item === 'string') {
              item = { name: item, url: item }
            }
            item.uid = item.uid || new Date().getTime() + temp++
            return item
          })
        } else {
          this.fileList = []
          return []
        }
      },
      deep: true,
      immediate: true
    }
  },
  created() {},
  computed: {
    // 是否显示提示
    showTip() {
      return this.isShowTip && (this.fileType || this.fileSize)
    }
  },
  methods: {
    // 上传前校检格式和大小
    handleBeforeUpload(file) {
      // 校检文件类型
      if (this.fileType) {
        let fileExtension = ''
        if (file.name.lastIndexOf('.') > -1) {
          fileExtension = file.name.slice(file.name.lastIndexOf('.') + 1)
        }
        const isTypeOk = this.fileType.some(type => {
          if (file.type.indexOf(type) > -1) return true
          if (fileExtension && fileExtension.indexOf(type) > -1) return true
          return false
        })
        if (!isTypeOk) {
          this.$message.error(
            `文件格式不正确, 请上传${this.fileType.join('/')}格式文件!`
          )
          return false
        }
      }
      // 校检文件大小
      if (this.fileSize) {
        const isLt = file.size / 1024 / 1024 < this.fileSize
        if (!isLt) {
          this.$message.error(`上传文件大小不能超过 ${this.fileSize} MB!`)
          return false
        }
      }
      return true
    },
    // 文件个数超出
    handleExceed() {
      this.$message.error(`上传文件数量不能超过 ${this.limit} 个!`)
    },
    // 上传失败
    handleUploadError(err) {
      this.$message.error('上传失败, 请重试')
    },
    // 上传成功回调
    handleUploadSuccess(res, file) {
      this.$message.success('上传成功')
      console.log(res)
      // this.fileList.push({ name: res.fileName, url: res.fileName })
      this.$emit('input', res)
    },
    // 删除文件
    handleDelete(index) {
      this.fileList.splice(index, 1)
      this.$emit('input', this.listToString(this.fileList))
    },
    // 获取文件名称
    getFileName(name) {
      if (name.lastIndexOf('/') > -1) {
        return name.slice(name.lastIndexOf('/') + 1).toLowerCase()
      } else {
        return ''
      }
    },
    // 对象转成指定字符串分隔
    listToString(list, separator) {
      let strs = ''
      separator = separator || ','
      for (const i in list) {
        strs += list[i].url + separator
      }
      return strs != '' ? strs.substr(0, strs.length - 1) : ''
    },
    handlePost(event, file, fileList) {
      console.log('event :>> ', event)
      console.log('file :>> ', file)
      console.log('fileList :>> ', fileList)
    },
    uploading(file) {
      const _this = this
      this.createVod(file.file.name).then(res => {
        const re = /(?<=com((:\d+)|)\/).*(?=\?)/g
        // console.log('this.vodAuth 1 :>> ', this)
        let object = _this.vodAuth.uploadUrl.match(re)[0]
        // console.log('file :>> ', file)
        const suffixName = file.file.name.split('.')[1]
        object = object.replace('unknow', suffixName)
        // console.log('file file :>> ', file.file.name.split('.')[1])
        // console.log('object :>> ', object)
        // 添加到上传文件列表
        _this.vodClient.addAsset({
          // 必选，通过服务端创建媒资返回的OBS桶
          bucket: _this.vodAuth.bucket,
          // 必选，通过服务端创建媒资返回的region信息
          location: _this.vodAuth.region,
          // 必选，通过服务端创建媒资返回的文件上传路径
          object: object,
          // 必选，通过服务端创建媒资返回的媒资ID(asset_id)
          asset_id: _this.vodAuth.assetId,
          // 必选，选择上传的文件
          videoFile: file.file,
          // 非必选，是否进行重复上传校验,默认值为false
          is_check: false
        })
        _this.tempFileList.push(file)
        _this.vodClient.startUpload()
      })
    },
    createVod(fileName) {
      const _this = this
      return new Promise(async function(resolve, reject) {
        await getVodAuth({ title: fileName }).then(res => {
          _this.vodAuth = res.data
          _this.vodClient = new VodClient({
            // 必选，临时凭证AK
            access_key_id: res.data.ak,
            // 必选，临时凭证SK
            secret_access_key: res.data.sk,
            // 必选，临时凭证security_token
            security_token: res.data.securityToken,
            // 必选，项目ID project_id
            project_id: res.data.projectId,
            // 必选，点播的终端节点Endpoint，默认值是vod.cn-north-4.myhuaweicloud.com
            vod_server: 'vod.cn-north-4.myhuaweicloud.com',
            // 可选，点播终端节点端口号，默认值为空
            vod_port: '',

            // 开始上传
            onUploadstarted: function(assetInfo) {
              const _file = _this.tempFileList
                .filter(e => {
                  return e.file.uid == assetInfo.file.uid
                })
                .map(e => {
                  e.file.status = 'uploading'
                  e.onProgress({ percent: 0 })
                  return e
                })
              // console.log('_file :>> ', _file)
            },

            // 上传进度
            onUploadProgress: function(assetInfo) {
              // _upload.onProgress({ percent: assetInfo.progress })
              assetInfo.file.percentage = assetInfo.progress
              _this.tempFileList
                .filter(e => {
                  return e.file.uid == assetInfo.file.uid
                })
                .map(e => {
                  e.file.percentage = assetInfo.progress
                  e.onProgress({ percent: assetInfo.progress })
                  return e
                })
              console.log('上传进度 :>> ', assetInfo.progress)
            },

            // 合并段成功
            onUploadSucceed: function(assetInfo) {
              console.log(assetInfo.file.name + ' 合并段成功')
              _this.tempFileList
                .filter(e => {
                  return e.file.uid == assetInfo.file.uid
                })
                .map(e => {
                  e.file.status = 'success'
                  confirmVod({ assetId: res.data.assetId }).then(reso => {
                    console.log('确认上传 :>> ', reso)
                    e.onSuccess(res.data.assetId)
                  })

                  return e
                })
            },

            // 上传异常，上传失败
            onUploadFailed: function(assetInfo, err) {
              _this.tempFileList
                .filter(e => {
                  return e.file.uid == assetInfo.file.uid
                })
                .map(e => {
                  e.file.status = 'failed'
                  e.file.message = '上传失败'
                  e.onError()
                  return e
                })
              try {
                console.log(assetInfo, err)
              } catch (err) {
                console.log(err)
              }
            },

            // 若凭证失效，重新设置凭证并上传
            onUploadTokenExpired: function() {
              console.log('onUploadTokenExpired')
              // 重新设置临时凭证并重新上传
              this.vodClient.resumeUpload('ak', 'sk', 'security_token')
            }
          })
        })
        resolve()
      })
    }
  }
}
</script>

<style scoped lang="scss">
.upload-file-uploader {
  margin-bottom: 5px;
}
.upload-file-list .el-upload-list__item {
  border: 1px solid #e4e7ed;
  line-height: 2;
  margin-bottom: 10px;
  position: relative;
}
.upload-file-list .ele-upload-list__item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: inherit;
}
.ele-upload-list__item-content-action .el-link {
  margin-right: 10px;
}
</style>