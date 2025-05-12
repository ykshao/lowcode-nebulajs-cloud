import randomstring from 'randomstring'
import BpmnModdle from 'bpmn-moddle'
import { layoutProcess } from 'bpmn-auto-layout'
import camundaModdle from 'camunda-bpmn-moddle/resources/camunda.json'
import { CamundaSysVars, CamundaTaskSysVars } from '../config/constants'
const moddle = new BpmnModdle({ camunda: camundaModdle })

export class WFlowBuilder {
    processElement
    flowElements
    definitionsElement

    constructor({ id, name, documentation }) {
        const documentationElement = moddle.create('bpmn:Documentation', {
            text: documentation,
        })
        const definitionsElement = moddle.create('bpmn:Definitions', {
            targetNamespace: 'http://www.nebulajs.com',
            // candidateStarterGroups: ,
            // candidateGroups:
        })
        // const processProperties = moddle.create('camunda:Properties', {
        //     values: [
        //         moddle.create('camunda:Property', {
        //             name: CamundaProcessProperties.AppCode,
        //             value: appCode,
        //         }),
        //     ],
        // })
        // const processExtensionElements = moddle.create(
        //     'bpmn:ExtensionElements',
        //     {
        //         values: [processProperties],
        //     }
        // )
        const processElement = moddle.create('bpmn:Process', {
            id,
            name,
            documentation: [documentationElement],
            isExecutable: true,
            // extensionElements: processExtensionElements,
        })
        definitionsElement.get('rootElements').push(processElement)

        this.definitionsElement = definitionsElement
        this.processElement = processElement
        this.flowElements = processElement.get('flowElements')
    }

    loadWFlowData(processJSON) {
        const processData = JSON.parse(processJSON)
        this.prepareData(processData)
        this.readWFlowData(processData)
        return this
    }

    prepareData(processData) {
        const { id, type, children, branchs = [] } = processData
        if (children && children.id) {
            if (children.type === 'EMPTY') {
                processData.children = children.children
                this.prepareData(processData.children)
            } else {
                this.prepareData(children)
            }
        }
        for (let i = 0; i < branchs.length; i++) {
            this.prepareData(branchs[i])
        }
    }

    async toXml({ layout = true }) {
        const { xml } = await moddle.toXML(this.definitionsElement, {
            format: true,
        })
        if (layout) {
            return await layoutProcess(xml)
        }
        return xml
    }

    createTaskListeners() {
        const createListener = moddle.create('camunda:TaskListener', {
            event: 'create',
            script: moddle.create('camunda:Script', {
                scriptFormat: 'JavaScript',
                value: `task.setVariableLocal("${CamundaTaskSysVars.NewTaskEvent}",'create');`,
            }),
        })
        // 完成监听
        const completeListener = moddle.create('camunda:TaskListener', {
            event: 'complete',
            script: moddle.create('camunda:Script', {
                scriptFormat: 'JavaScript',
                value: `task.setVariableLocal("${CamundaTaskSysVars.HisTaskEvent}",'complete');`,
            }),
        })
        // 删除监听
        const deleteListener = moddle.create('camunda:TaskListener', {
            event: 'delete',
            script: moddle.create('camunda:Script', {
                scriptFormat: 'JavaScript',
                value: `task.setVariableLocal("${CamundaTaskSysVars.HisTaskEvent}",'delete');`,
            }),
        })
        // 超时监听
        // const timeoutListener = moddle.create('camunda:TaskListener', {
        //     event: 'timeout',
        //     script: moddle.create('camunda:Script', {
        //         scriptFormat: 'JavaScript',
        //         value: `task.setVariableLocal("${CamundaTaskSysVars.HisTaskEvent}",'timeout');`,
        //     }),
        // })
        return [
            createListener,
            completeListener,
            deleteListener,
            // timeoutListener,
        ]
    }

    readWFlowData(processData, gatewayChildElement = null) {
        const {
            id,
            name = '',
            type,
            parentId,
            children,
            branchs,
            props,
        } = processData

        if (!id) {
            return null
        }

        console.log(type + '-' + name)
        console.log('---------------------------------------')

        // 递归子节点
        let childElement = this.readWFlowData(children, gatewayChildElement)
        let currElement = null

        if (type === 'ROOT') {
            const { assignedUser = [] } = props
            // currElement = moddle.create('bpmn:UserTask', {
            //     id,
            //     name,
            //     // candidateUsers: assignedUser.map((u) => u.id).join(','),
            // })
            currElement = moddle.create('bpmn:StartEvent', {
                id: 'startEventNode',
                name,
            })
            // const seqFlow = moddle.create('bpmn:SequenceFlow', {
            //     sourceRef: startEvent,
            //     targetRef: currElement,
            //     id: this.generateNodeId(),
            // })
            // this.processElement.set('candidateStarterGroups')
            this.processElement.set(
                'candidateStarterUsers',
                assignedUser.map((u) => u.id).join(',')
            )
            // this.flowElements.push(startEvent)
            this.flowElements.push(currElement)
            // this.flowElements.push(seqFlow)
        } else if (type === 'APPROVAL') {
            const {
                mode, //WAIT_CLAIM,SELECT_ONE,SELECT_MULTIPLE
                assignedType,
                formUser,
                role = [],
                assignedUser = [], // 包含组织（type='dept'）
                formVariables = [],
            } = props

            // camunda表单变量
            let formVars = formVariables.filter((v) => v.id && v.value)
            const formFields = []
            for (const variable of formVars) {
                const formField = moddle.create('camunda:FormField', {
                    id: variable.id,
                    label: variable.id,
                    type: 'string',
                    defaultValue: variable.value,
                })
                formFields.push(formField)
            }
            const formData = moddle.create('camunda:FormData', {
                fields: formFields,
            })
            const taskListeners = this.createTaskListeners()
            const extensionElements = moddle.create('bpmn:ExtensionElements', {
                values: [...taskListeners, formData],
            })

            // 用户任务属性
            const userTaskAttr = {
                id,
                name,
                extensionElements,
            }

            // 指派类型
            if (assignedType === 'ROLE') {
                // 指定角色
                userTaskAttr['candidateGroups'] = role
                    .map((r) => r.id)
                    .join(',')
                if (mode === 'SELECT_ONE') {
                    // 用户选一人
                    userTaskAttr['assignee'] =
                        '${' + CamundaSysVars.Assignee + '}'
                } else if (mode === 'SELECT_MULTIPLE') {
                    // 用户选多人（并行）
                    const multiInstanceLoopCharacteristics = moddle.create(
                        'bpmn:MultiInstanceLoopCharacteristics',
                        {
                            collection:
                                '${' + CamundaSysVars.AssigneeList + '}',
                            elementVariable: CamundaSysVars.Assignee,
                        }
                    )
                    userTaskAttr['assignee'] =
                        '${' + CamundaSysVars.Assignee + '}'
                    userTaskAttr['loopCharacteristics'] =
                        multiInstanceLoopCharacteristics
                }
            } else if (assignedType === 'FORM_USER') {
                // 指定表单内用户
                userTaskAttr['assignee'] = '${' + formUser + '}'
            } else if (assignedType === 'ASSIGN_USER') {
                // type='dept' 部门暂时不处理
                const users = assignedUser.filter((u) => u.type === 'user')
                // 指定用户
                if (users.length > 1) {
                    userTaskAttr['candidateUsers'] = users
                        .map((u) => u.login)
                        .join(',')
                } else {
                    userTaskAttr['assignee'] = users[0].login
                }
            }

            currElement = moddle.create('bpmn:UserTask', userTaskAttr)
            this.flowElements.push(currElement)
        } else if (type === 'CONCURRENTS' || type === 'CONDITIONS') {
            // 'CONCURRENTS': 并行网关
            // 'CONDITIONS': 排他网关
            if (type === 'CONCURRENTS') {
                currElement = moddle.create('bpmn:ParallelGateway', {
                    id,
                    name,
                })
            } else if (type === 'CONDITIONS') {
                currElement = moddle.create('bpmn:ExclusiveGateway', {
                    id,
                    name,
                })
            }
            this.flowElements.push(currElement)
            for (let i = 0; i < branchs.length; i++) {
                const { expression } = branchs[i].props
                const branchChildElement = this.readWFlowData(
                    branchs[i].children,
                    childElement // 网关子项
                )
                // 匹配到子项，连接到分支子项
                // 没匹配到子项，连接到网关子项（下一节点）
                const targetRef = branchChildElement || childElement
                const expressionElement = moddle.create('bpmn:Expression', {
                    body: expression,
                })
                const seqFlow = moddle.create('bpmn:SequenceFlow', {
                    sourceRef: currElement,
                    targetRef: targetRef,
                    id: branchs[i].id,
                    name: branchs[i].name,
                    conditionExpression: expressionElement,
                })
                seqFlow.sourceRef.get('outgoing').push(seqFlow)
                seqFlow.targetRef.get('incoming').push(seqFlow)
                this.flowElements.push(seqFlow)
            }
            return currElement
        } else if (type === 'CC') {
            currElement = moddle.create('bpmn:UserTask', { id, name })
            this.flowElements.push(currElement)
        } else {
            throw new Error(`Invalid element type: [${type}]`)
        }

        // 匹配到子项，添加连接线
        if (childElement) {
            const seqFlow = moddle.create('bpmn:SequenceFlow', {
                id: this.generateNodeId(),
                sourceRef: currElement,
                targetRef: childElement,
            })
            seqFlow.sourceRef.get('outgoing').push(seqFlow)
            seqFlow.targetRef.get('incoming').push(seqFlow)
            this.flowElements.push(seqFlow)
        } else {
            // 没有子项，但有网关，用当前项指向网关下个节点
            if (gatewayChildElement) {
                const seqFlow = moddle.create('bpmn:SequenceFlow', {
                    id: this.generateNodeId(),
                    sourceRef: currElement,
                    targetRef: gatewayChildElement,
                })
                seqFlow.sourceRef.get('outgoing').push(seqFlow)
                seqFlow.targetRef.get('incoming').push(seqFlow)
                this.flowElements.push(seqFlow)
            } else {
                // 没有子项，也没有网关
                // 自动添加结束事件
                let endEvent = this.flowElements.find(
                    (e) => e.id === 'endEventNode'
                )
                if (!endEvent) {
                    endEvent = moddle.create('bpmn:EndEvent', {
                        id: 'endEventNode',
                    })
                    this.flowElements.push(endEvent)
                }
                const seqFlow = moddle.create('bpmn:SequenceFlow', {
                    sourceRef: currElement,
                    targetRef: endEvent,
                    id: this.generateNodeId(),
                })
                seqFlow.sourceRef.get('outgoing').push(seqFlow)
                seqFlow.targetRef.get('incoming').push(seqFlow)
                this.flowElements.push(seqFlow)
            }
        }

        return currElement
    }

    generateNodeId() {
        const random = randomstring.generate({
            length: 12,
            charset: 'numeric',
        })
        return `node_${random}`
    }
}
