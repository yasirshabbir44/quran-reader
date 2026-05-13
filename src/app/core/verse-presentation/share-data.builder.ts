/**
 * Builder (GoF): construct ShareData step-by-step; easy to extend with new fields later.
 */
export class ShareDataBuilder {
  private title = '';
  private text = '';
  private url = '';

  setTitle(value: string): this {
    this.title = value;
    return this;
  }

  setText(value: string): this {
    this.text = value;
    return this;
  }

  setUrl(value: string): this {
    this.url = value;
    return this;
  }

  build(): ShareData {
    return {
      title: this.title,
      text: this.text,
      url: this.url,
    };
  }
}
