declare class ServiceRole {
  /**
   * @param options configuration options for the IAM role
   */
  constructor(options: {
    /** the logical name of the IAM role within the CloudFormation template. */
    LogicalName: string,
    /** the name of the AWS service that will assume this role, e.g. `lambda` */
    Service: string,
    Statement?: Array<object>,
    ManagedPolicyArns?: Array<string>,
    MaxSessionDuration?: number,
    Path?: string,
    RoleName?: string,
    Condition?: string,
    DependsOn?: string
  })
}

export { ServiceRole };
