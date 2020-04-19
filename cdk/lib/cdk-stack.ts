import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as path from "path";
import { CfnOutput } from '@aws-cdk/core';

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda
    const fn = new lambda.Function(this, "MyLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "build/lambda.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../cdk-api.zip"))
    });

    // ApiGW
    const apigw = new apigateway.LambdaRestApi(this, "MyApi", {
      handler: fn,
      proxy: true
    });

    // CF
    const feCf = new cloudfront.CloudFrontWebDistribution(this, "MyCf", {
      defaultRootObject: "/",
      originConfigs: [{
        customOriginSource: {
          domainName: `${apigw.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        },
        originPath: '/' + apigw.deploymentStage.stageName,
        behaviors: [{
          isDefaultBehavior: true,
        }]
      }],
      enableIpV6: true,
    });

    new CfnOutput(this, "myOut", {
      value: feCf.domainName
    })
  }
}
