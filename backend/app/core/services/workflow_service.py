from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.workflow import Task, Approval, Notification

class WorkflowService:
    @staticmethod
    def create_task(
        db: Session,
        title: str,
        task_type: str,
        assigned_to_user_id: str,
        org_id: Optional[str] = None,
        created_by_user_id: Optional[str] = None,
        description: Optional[str] = None,
        due_date: Optional[datetime] = None,
        priority: str = "MEDIUM",
        metadata_json: Optional[Dict[str, Any]] = None
    ) -> Task:
        task = Task(
            title=title,
            description=description,
            task_type=task_type,
            status="PENDING",
            priority=priority,
            assigned_to_user_id=assigned_to_user_id,
            due_date=due_date,
            org_id=org_id,
            created_by=created_by_user_id,
            metadata_json=metadata_json or {}
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        
        # Automatically send notification to assigned user
        WorkflowService.create_notification(
            db,
            recipient_user_id=assigned_to_user_id,
            title=f"New Task Assigned: {title}",
            message=description or f"You have been assigned a task of type {task_type}.",
            notification_type="TASK_ASSIGNED",
            org_id=org_id
        )
        
        return task

    @staticmethod
    def approve_task(
        db: Session,
        task_id: str,
        approver_user_id: str,
        comments: Optional[str] = None
    ) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task with ID {task_id} not found.")
            
        task.status = "COMPLETED"
        task.updated_at = datetime.now(timezone.utc)
        
        # Create approval record
        approval = Approval(
            task_id=task_id,
            entity_type=task.task_type,
            entity_id=task.id,
            approver_user_id=approver_user_id,
            status="APPROVED",
            comments=comments,
            approved_at=datetime.now(timezone.utc),
            org_id=task.org_id,
            created_by=approver_user_id
        )
        db.add(approval)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def escalate_task(
        db: Session,
        task_id: str,
        escalate_to_user_id: str,
        reason: Optional[str] = None
    ) -> Task:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task with ID {task_id} not found.")
            
        task.status = "ESCALATED"
        task.escalated_to_user_id = escalate_to_user_id
        task.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(task)
        
        WorkflowService.create_notification(
            db,
            recipient_user_id=escalate_to_user_id,
            title=f"Task Escalated: {task.title}",
            message=f"Task {task.id} has been escalated to you. Reason: {reason or 'Overdue / Unresolved'}",
            notification_type="ALERT",
            org_id=task.org_id
        )
        return task

    @staticmethod
    def create_notification(
        db: Session,
        recipient_user_id: str,
        title: str,
        message: str,
        notification_type: str = "INFO",
        org_id: Optional[str] = None,
        link: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            recipient_user_id=recipient_user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False,
            org_id=org_id,
            link=link
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
