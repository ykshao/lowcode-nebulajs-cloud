export class MessageHandler {
    static async handleProcessFormUpdateMessage(params) {
        nebula.logger.info('received process form update message: %o', params)
        try {
            const { id, model, props } = params
            const processModel = nebula.sequelize.models[model]
            const dataModel = await processModel.getByPk(id)
            dataModel.set(props)
            await dataModel.save()
        } catch (e) {
            nebula.logger.error('update process model error, %o', e)
        }
    }

    static async handleProcessTaskCreatedMessage(params) {
        nebula.logger.info('process task create message: %o', params)
        // do something
    }

    static async handleProcessTaskCompletedMessage(params) {
        nebula.logger.info('process task complete message: %o', params)
        // do something
    }

    static async handleProcessTaskDeletedMessage(params) {
        nebula.logger.info('process task delete message: %o', params)
        // do something
    }

    static async handleProcessInstanceCompletedMessage(params) {
        nebula.logger.info('process instance complete message: %o', params)
        // do something
    }

    static async handleProcessInstanceTerminatedMessage(params) {
        nebula.logger.info('process instance terminated message: %o', params)
        // do something
    }
}
