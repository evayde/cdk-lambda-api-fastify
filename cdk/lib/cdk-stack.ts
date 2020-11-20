import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigatewayv2 from "@aws-cdk/aws-apigatewayv2";
import * as apigatewayv2Integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as path from "path";

export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // lambda
    const fn = new lambda.Function(this, "MyLambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "build/lambda.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../../"), {
        exclude: ["cdk"],
      }),
    });

    // ApiGWv2
    const httpApiIntegration = new apigatewayv2Integrations.LambdaProxyIntegration({
      handler: fn,
    });

    const httpApi = new apigatewayv2.HttpApi(this, "MyApi");
    httpApi.addRoutes({
      path: "/",
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: httpApiIntegration,
    });

    // CF
    const feCf = new cloudfront.CloudFrontWebDistribution(this, "MyCf", {
      defaultRootObject: "/",
      originConfigs: [
        {
          customOriginSource: {
            domainName: `${httpApi.httpApiId}.execute-api.${this.region}.${this.urlSuffix}`,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      enableIpV6: true,
    });

    // Output
    new cdk.CfnOutput(this, "myOut", {
      value: feCf.distributionDomainName,
    });
  }
}
