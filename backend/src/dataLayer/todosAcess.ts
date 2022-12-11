import * as AWS from 'aws-sdk';
import * as AWSXRay from 'aws-xray-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { createLogger } from '../utils/logger';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';

const XAWS = AWSXRay.captureAWS(AWS);
XAWS.config.update({region: process.env.DEFAULT_AWS_REGION || 'us-east-1'});

const logger = createLogger('TodosAccess');

export class TodosAccess {
    constructor(
        private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
        private readonly todosTable = process.env.TODOS_TABLE) {
    }
  
    async getTodos(userId: string): Promise<TodoItem[]> {
        logger.debug('Getting all todos');

        const params = {
            TableName: this.todosTable,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };
  
        const result = await this.docClient.query(params).promise();
  
        return result.Items as TodoItem[];
    }
  
    async createTodo(todo: TodoItem): Promise<TodoItem> {
        logger.debug('Create new todo');

        await this.docClient.put({
            TableName: this.todosTable,
            Item: todo
        }).promise();
  
        return todo as TodoItem;
    }

    async updateTodo(todoId: string, userId: string, model: TodoUpdate): Promise<TodoItem> {
        logger.debug('Update todo');

        const params = {
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId                
            },
            UpdateExpression: "set name = :name, dueDate = :dueDate, done = :done",
            ExpressionAttributeValues: {
                ":name": model.name,
                ":dueDate": model.dueDate,
                ":done": model.done
            },
            ReturnValues: "ALL_NEW"
        };

        const result = await this.docClient.update(params).promise();

        return result.Attributes as TodoItem;
    }

    async deleteTodo(todoId: string, userId: string): Promise<any> {
        console.log("Deleting todo");

        const params = {
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId                
            },
        };

        return await this.docClient.delete(params).promise();
    }

    async updateAttachmentForTodo(todoId: string, userId: string, attachmentUrl: string): Promise<TodoItem> {
        logger.debug('Update attachment');

        const params = {
            TableName: this.todosTable,
            Key: {
                todoId: todoId,
                userId: userId                
            },
            UpdateExpression: "set attachmentUrl = :url",
            ExpressionAttributeValues: {
                ":url": attachmentUrl
            },
            ReturnValues: "ALL_NEW"
        };

        const result = await this.docClient.update(params).promise();

        return result.Attributes as TodoItem;
    }
}