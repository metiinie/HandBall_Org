import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'

@Injectable()
export class SseService {
  private matchSubjects: Map<string, Subject<any>> = new Map()

  getSubject(roundId: string): Subject<any> {
    if (!this.matchSubjects.has(roundId)) {
      this.matchSubjects.set(roundId, new Subject<any>())
    }
    return this.matchSubjects.get(roundId)!
  }

  emitMatchUpdate(roundId: string, match: any) {
    const subject = this.matchSubjects.get(roundId)
    if (subject) {
      subject.next({ data: match })
    }
  }
}
