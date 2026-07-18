`timescale 1ns/1ps

module tb_add8u;

reg  [7:0] a;
reg  [7:0] b;
wire [8:0] y;

add8u uut (
    .a(a),
    .b(b),
    .y(y)
);

initial begin
    a = 0;   b = 0;
    #10;

    a = 8'd5;   b = 8'd3;     // 8
    #10;

    a = 8'd100; b = 8'd50;    // 150
    #10;

    a = 8'd200; b = 8'd100;   // 300
    #10;

    a = 8'd255; b = 8'd255;   // 510
    #10;

    $finish;
end

endmodule